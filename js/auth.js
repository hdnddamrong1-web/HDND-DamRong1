/* =========================================================
   Quản lý đăng nhập Admin/Cán bộ bằng Supabase Auth
   - Chỉ những tài khoản được TẠO SẴN trong Supabase Dashboard
     (Authentication > Users) mới đăng nhập được.
   - Đăng ký công khai đã bị tắt ở phía Supabase, nên không ai
     tự tạo tài khoản mới được ngoài quản trị viên thật.
   - Mật khẩu được Supabase mã hoá và kiểm tra ở server, KHÔNG
     bao giờ được gửi thô hay so sánh ở trình duyệt.
========================================================= */

let currentSession = null;
let _authReadyResolve;
const authReady = new Promise((resolve) => { _authReadyResolve = resolve; });

(async function initAuth() {
  try {
    const { data } = await supabaseClient.auth.getSession();
    currentSession = data.session;
  } catch (e) {
    console.error('Lỗi khởi tạo auth:', e);
  } finally {
    _authReadyResolve();
  }
})();

supabaseClient.auth.onAuthStateChange((_event, session) => {
  currentSession = session;
});

/* Chờ cho tới khi đã xác định xong trạng thái đăng nhập (chạy 1 lần khi tải trang) */
function waitForAuth() {
  return authReady;
}

function getSession() {
  return currentSession;
}

function isLoggedIn() {
  return !!currentSession;
}

function getAdminDisplayName() {
  if (!currentSession) return '';
  const meta = currentSession.user.user_metadata || {};
  return meta.ho_ten || currentSession.user.email;
}

function getAdminRole() {
  if (!currentSession) return '';
  const meta = currentSession.user.user_metadata || {};
  return meta.vai_tro || 'Cán bộ';
}

/* Đại biểu HĐND là 1 vai trò riêng (vai_tro = 'Đại biểu' trong user_metadata),
   chỉ được xem văn bản dự thảo & gửi ý kiến đóng góp - KHÔNG có quyền quản trị
   như Cán bộ (không vào được các tab Kiến nghị/Văn bản/Tin tức của Dashboard). */
function isRepresentative() {
  return isLoggedIn() && getAdminRole() === 'Đại biểu';
}

/* Tài khoản Đại biểu do Admin cấp bằng CCCD (chưa đổi mật khẩu lần nào) sẽ có cờ
   user_metadata.phai_doi_mk = true (đặt lúc tạo tài khoản, xoá đi sau khi đổi mật khẩu
   thành công). Trang dai-bieu.html dùng cờ này để ép đổi mật khẩu trước khi dùng tiếp. */
function mustChangePassword() {
  if (!currentSession) return false;
  const meta = currentSession.user.user_metadata || {};
  return meta.phai_doi_mk === true;
}

/* Đổi mật khẩu cho tài khoản đang đăng nhập (dùng cho ép đổi mật khẩu lần đầu
   của Đại biểu, và có thể dùng lại cho đổi mật khẩu thông thường). */
async function changeOwnPassword(newPassword) {
  if (!currentSession) return { ok: false, message: 'Chưa đăng nhập.' };
  // Supabase merge user_metadata theo kiểu shallow-merge, nhưng để chắc chắn không
  // mất ho_ten/vai_tro đang có, gộp tay lại rồi mới gửi lên.
  const prevMeta = currentSession.user.user_metadata || {};
  const wasRepresentative = prevMeta.vai_tro === 'Đại biểu';
  const userEmail = currentSession.user.email;
  const { data, error } = await supabaseClient.auth.updateUser({
    password: newPassword,
    data: { ...prevMeta, phai_doi_mk: false }
  });
  if (error) return { ok: false, message: error.message || 'Đổi mật khẩu thất bại.' };
  currentSession = { ...currentSession, user: data.user };

  // Đồng bộ trạng thái "đã đổi mật khẩu" sang bảng theo dõi dai_bieu_accounts
  // (chỉ để Admin xem đúng trạng thái trên Dashboard) - không chặn luồng đăng nhập
  // nếu bước này lỗi (ví dụ bảng chưa được tạo).
  if (wasRepresentative && userEmail) {
    try {
      await supabaseClient.from('dai_bieu_accounts').update({ da_doi_mat_khau: true }).eq('email_noi_bo', userEmail);
    } catch (e) {
      console.error('Không đồng bộ được trạng thái đổi mật khẩu vào dai_bieu_accounts:', e);
    }
  }

  return { ok: true };
}

async function logout() {
  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.error(e);
  }
  window.location.href = 'index.html';
}

async function loginWithEmailPassword(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email.trim(),
    password
  });
  if (error) {
    return { ok: false, message: 'Email hoặc mật khẩu không đúng.' };
  }
  currentSession = data.session;
  return { ok: true, session: data.session };
}

/* Render phần đăng nhập / thông tin admin trên header của MỌI trang */
async function renderAuthArea() {
  const el = document.getElementById('nav-auth-area');
  if (!el) return;
  await waitForAuth();
  if (isLoggedIn()) {
    const rep = isRepresentative();
    el.innerHTML = `
      <a href="${rep ? 'dai-bieu.html' : 'dashboard.html'}" class="dashboard-link"><i class="fa-solid fa-chart-line"></i><span>${rep ? 'Khu vực đại biểu' : 'Dashboard'}</span></a>
      <span class="admin-chip">
        <span class="name">${escapeHtml(getAdminDisplayName())}</span>
        <span class="badge">${escapeHtml(getAdminRole())}</span>
      </span>
      <button class="btn-logout" id="btn-logout-header"><i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất</button>
    `;
    const btn = document.getElementById('btn-logout-header');
    if (btn) btn.addEventListener('click', logout);
  } else {
    el.innerHTML = `
      <a href="login.html" class="btn-login"><i class="fa-solid fa-user"></i><span>Đăng nhập</span></a>
    `;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Bảo vệ trang admin: nếu chưa đăng nhập thì đưa về trang login.
   Trả về true nếu đã đăng nhập (cho phép trang tiếp tục chạy). */
async function guardAdminPage() {
  await waitForAuth();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/* Bảo vệ trang Dashboard quản trị: CHỈ Cán bộ (không phải Đại biểu) mới vào được.
   Đại biểu lỡ vào nhầm sẽ tự chuyển sang khu vực riêng của mình. */
async function guardStaffPage() {
  await waitForAuth();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  if (isRepresentative()) {
    window.location.href = 'dai-bieu.html';
    return false;
  }
  return true;
}

/* Bảo vệ trang Đại biểu: CHỈ tài khoản có vai_tro = 'Đại biểu' mới vào được.
   Người dân chưa đăng nhập hoặc Cán bộ thường sẽ không truy cập được trang này.
   Nếu tài khoản còn đang dùng mật khẩu mặc định (chưa đổi mật khẩu lần đầu),
   BẮT BUỘC quay lại login.html để đổi mật khẩu trước (chặn truy cập thẳng URL để bỏ qua bước này). */
async function guardRepresentativePage() {
  await waitForAuth();
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  if (!isRepresentative()) {
    window.location.href = 'index.html';
    return false;
  }
  if (mustChangePassword()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
