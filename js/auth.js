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
   Người dân chưa đăng nhập hoặc Cán bộ thường sẽ không truy cập được trang này. */
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
  return true;
}
