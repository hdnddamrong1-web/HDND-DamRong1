/* =========================================================
   Các hàm & thành phần dùng chung cho toàn bộ site (Supabase)
========================================================= */

const NAV_ITEMS = [
  { href: 'index.html', label: 'Trang chủ' },
  { href: 'gioi-thieu.html', label: 'Giới thiệu' },
  { href: 'hoat-dong.html', label: 'Hoạt động HĐND' },
  { href: 'van-ban.html', label: 'Văn bản' },
  { href: 'tin-tuc.html', label: 'Tin tức' },
  { href: 'lien-he.html', label: 'Liên hệ' }
];

function currentPage() {
  const p = window.location.pathname.split('/').pop();
  return p || 'index.html';
}

function renderHeader() {
  const mount = document.getElementById('site-header');
  if (!mount) return;
  const cur = currentPage();
  const navHtml = NAV_ITEMS.map(
    (item) => `<a href="${item.href}" class="${item.href === cur ? 'active' : ''}">${item.label}</a>`
  ).join('');

  mount.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <a href="index.html" class="brand">
          <img src="images/quoc-huy-v2.png" alt="Quốc huy Việt Nam">
          <span class="brand-text">
            <span class="brand-title">HỘI ĐỒNG NHÂN DÂN XÃ ĐAM RÔNG 1</span>
            <span class="brand-sub">Lắng nghe - Kết nối - Đồng hành</span>
          </span>
        </a>
        <button class="mobile-toggle" id="mobile-toggle-btn" aria-label="Mở menu"><i class="fa-solid fa-bars"></i></button>
      </div>
    </div>
    <nav class="main-nav">
      <div class="main-nav-inner">
        <div class="nav-links" id="nav-links">${navHtml}</div>
        <div class="nav-auth" id="nav-auth-area"></div>
      </div>
    </nav>
  `;

  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const navLinks = document.getElementById('nav-links');
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  renderAuthArea();
}

function renderFooter() {
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  mount.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand">
        <img src="images/quoc-huy-v2.png" alt="Quốc huy">
        <div>
          <h4>HỘI ĐỒNG NHÂN DÂN XÃ ĐAM RÔNG 1</h4>
          <p>Lắng nghe - Kết nối - Đồng hành</p>
        </div>
      </div>
      <div class="footer-col">
        <h5>Liên hệ</h5>
        <p><i class="fa-solid fa-location-dot"></i>&nbsp; Xã Đam Rông 1, tỉnh Lâm Đồng</p>
        <p><i class="fa-solid fa-phone"></i>&nbsp; 0365 008 008</p>
        <p><i class="fa-solid fa-envelope"></i>&nbsp; hdnddamrong1@lamdong.gov.vn</p>
      </div>
      <div class="footer-col">
        <h5>Theo dõi chúng tôi</h5>
        <div class="footer-social">
          <a href="https://www.facebook.com/profile.php?id=61578030147233" target="_blank" rel="noopener" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" aria-label="Zalo"><i class="fa-solid fa-comment-dots"></i></a>
          <a href="#" aria-label="Youtube"><i class="fa-brands fa-youtube"></i></a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">DÂN CHỦ - TRÁCH NHIỆM - HIỆU QUẢ - VÌ NHÂN DÂN</div>
  `;
}

/* ---------- Helpers chung ---------- */
function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function statusPillClass(status) {
  if (status === 'Đã giải quyết') return 'status-done';
  if (status === 'Đang xử lý') return 'status-processing';
  return 'status-received';
}

/* ---------- Truy vấn dữ liệu qua Supabase ----------
   fetchAll(table, { sort: '-ngay_gui' hoặc 'ten_thon', limit: 200 })
   Giữ nguyên chữ ký hàm cũ để tối thiểu thay đổi ở các file gọi nó. */
async function fetchAll(table, extraParams) {
  const opts = extraParams || {};
  let query = supabaseClient.from(table).select('*');

  if (opts.sort) {
    const desc = opts.sort.startsWith('-');
    const col = desc ? opts.sort.slice(1) : opts.sort;
    query = query.order(col, { ascending: !desc });
  }
  if (opts.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`fetchAll(${table}) lỗi:`, error);
    throw error;
  }
  return data || [];
}

/* Upload 1 file lên Supabase Storage (bucket "attachments"), trả về URL công khai */
async function uploadToStorage(file, folder) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const safeFolder = folder || 'misc';
  const fileName = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabaseClient.storage.from('attachments').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data } = supabaseClient.storage.from('attachments').getPublicUrl(fileName);
  return data.publicUrl;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
});
