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
    el.innerHTML = `
      <a href="dashboard.html" class="dashboard-link"><i class="fa-solid fa-chart-line"></i><span>Dashboard</span></a>
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
