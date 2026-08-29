let allDocs = [];

const docTypeIcon = {
  'Nghị quyết': 'fa-gavel',
  'Báo cáo': 'fa-file-lines',
  'Kế hoạch': 'fa-list-check',
  'Văn bản chỉ đạo': 'fa-bullhorn',
  'Thông báo': 'fa-bell'
};

function renderDocList(docs) {
  const mount = document.getElementById('doc-list');
  if (docs.length === 0) {
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i>Không tìm thấy văn bản phù hợp</div>`;
    return;
  }
  mount.innerHTML = docs
    .map(
      (d) => `
    <div class="doc-card">
      <div class="ic"><i class="fa-solid ${docTypeIcon[d.loai] || 'fa-file'}"></i></div>
      <div class="body">
        <h4>${escapeHtml(d.tieu_de)}</h4>
        <div class="meta">
          <span class="tag-pill">${escapeHtml(d.loai || '')}</span>
          <span><i class="fa-solid fa-hashtag"></i> ${escapeHtml(d.so_hieu || 'Chưa cập nhật')}</span>
          <span><i class="fa-solid fa-calendar"></i> ${formatDate(d.ngay_ban_hanh)}</span>
        </div>
        <p class="desc">${escapeHtml(d.mo_ta || '')}</p>
      </div>
    </div>`
    )
    .join('');
}

function applyDocFilters() {
  const kw = document.getElementById('filter-keyword').value.trim().toLowerCase();
  const loai = document.getElementById('filter-loai').value;
  let filtered = allDocs;
  if (kw) {
    filtered = filtered.filter(
      (d) => (d.tieu_de || '').toLowerCase().includes(kw) || (d.so_hieu || '').toLowerCase().includes(kw)
    );
  }
  if (loai) filtered = filtered.filter((d) => d.loai === loai);
  renderDocList(filtered);
}

async function loadDocs() {
  try {
    allDocs = await fetchAll('van_ban', { sort: '-ngay_ban_hanh' });
    renderDocList(allDocs);
  } catch (e) {
    console.error(e);
    document.getElementById('doc-list').innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải văn bản</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDocs();
  document.getElementById('filter-keyword').addEventListener('input', applyDocFilters);
  document.getElementById('filter-loai').addEventListener('change', applyDocFilters);
  document.getElementById('filter-reset').addEventListener('click', () => {
    document.getElementById('filter-keyword').value = '';
    document.getElementById('filter-loai').value = '';
    renderDocList(allDocs);
  });
});
