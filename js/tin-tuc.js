let allNews = [];

function renderNewsList(list) {
  const mount = document.getElementById('news-list');
  if (list.length === 0) {
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-newspaper"></i>Không có bài viết nào</div>`;
    return;
  }
  mount.innerHTML = list
    .map(
      (n) => `
    <article class="news-card" onclick="openNewsDetail('${n.id}')" style="cursor:pointer;">
      <img src="${escapeHtml(n.hinh_anh || 'images/slide-kyhop-1.jpg')}" alt="${escapeHtml(n.tieu_de)}" loading="lazy">
      <div class="nc-body">
        <span class="tag-pill">${escapeHtml(n.loai || 'Tin tức')}</span>
        <h4 style="margin-top:8px;">${escapeHtml(n.tieu_de)}</h4>
        <p class="desc">${escapeHtml((n.mo_ta || '').toString().slice(0, 120))}...</p>
        <span style="font-size:12px;color:#8a7355;"><i class="fa-solid fa-calendar"></i> ${formatDate(n.ngay)}</span>
        <span style="display:block;margin-top:8px;color:var(--red-700);font-weight:700;font-size:13px;">Xem chi tiết <i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </article>`
    )
    .join('');
}

function openNewsDetail(id) {
  const n = allNews.find((x) => x.id === id);
  if (!n) return;
  document.getElementById('news-detail-title').textContent = n.tieu_de || '';
  document.getElementById('news-detail-meta').innerHTML = `
    <span class="tag-pill">${escapeHtml(n.loai || 'Tin tức')}</span>
    <span style="font-size:12px;color:#8a7355;margin-left:10px;"><i class="fa-solid fa-calendar"></i> ${formatDate(n.ngay)}</span>
  `;
  document.getElementById('news-detail-img').src = n.hinh_anh || 'images/slide-kyhop-1.jpg';
  document.getElementById('news-detail-img').alt = n.tieu_de || '';
  const noidung = (n.noi_dung || n.mo_ta || 'Chưa có nội dung chi tiết.').toString();
  document.getElementById('news-detail-body').innerHTML = escapeHtml(noidung).replace(/\n/g, '<br>');

  const gallery = document.getElementById('news-detail-gallery');
  const galleryImgs = Array.isArray(n.hinh_anh_phu) ? n.hinh_anh_phu : [];
  if (gallery) {
    gallery.innerHTML = galleryImgs.length
      ? `<h4 style="margin:16px 0 8px;font-size:14px;color:#8a7355;">Hình ảnh khác</h4>
         <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
           ${galleryImgs
             .map((url) => `<img src="${escapeHtml(url)}" alt="Ảnh hoạt động" style="width:100%;height:110px;object-fit:cover;border-radius:8px;cursor:pointer;" onclick="window.open('${escapeHtml(url)}','_blank')">`)
             .join('')}
         </div>`
      : '';
  }

  document.getElementById('modal-news-detail').classList.add('open');
}

function applyNewsFilters() {
  const kw = document.getElementById('filter-keyword').value.trim().toLowerCase();
  const loai = document.getElementById('filter-loai').value;
  let filtered = allNews;
  if (kw) filtered = filtered.filter((n) => (n.tieu_de || '').toLowerCase().includes(kw));
  if (loai) filtered = filtered.filter((n) => n.loai === loai);
  renderNewsList(filtered);
}

async function loadNews() {
  try {
    allNews = await fetchAll('tin_tuc', { sort: '-ngay' });
    renderNewsList(allNews);
  } catch (e) {
    console.error(e);
    document.getElementById('news-list').innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải tin tức</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNews();
  document.getElementById('filter-keyword').addEventListener('input', applyNewsFilters);
  document.getElementById('filter-loai').addEventListener('change', applyNewsFilters);

  const overlay = document.getElementById('modal-news-detail');
  const closeBtn = document.getElementById('modal-news-detail-close');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
});
