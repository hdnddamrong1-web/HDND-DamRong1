let allEvents = [];

const eventTypeIcon = {
  'Kỳ họp': 'fa-users-rectangle',
  'Giám sát': 'fa-magnifying-glass-chart',
  'Tiếp xúc cử tri': 'fa-people-group',
  'Khác': 'fa-calendar'
};

function renderEventList(list) {
  const mount = document.getElementById('event-list');
  if (list.length === 0) {
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-calendar-xmark"></i>Không có hoạt động nào</div>`;
    return;
  }
  const sorted = [...list].sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
  mount.innerHTML = sorted
    .map(
      (e) => `
    <div class="event-card">
      <div class="ic"><i class="fa-solid ${eventTypeIcon[e.loai] || 'fa-calendar'}"></i></div>
      <div class="body">
        <h4>${escapeHtml(e.tieu_de)}</h4>
        <div class="meta">
          <span class="tag-pill">${escapeHtml(e.loai || '')}</span>
          <span><i class="fa-solid fa-calendar"></i> ${formatDate(e.ngay)}</span>
          <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(e.dia_diem || '')}</span>
        </div>
        <p class="desc">${escapeHtml(e.noi_dung || '')}</p>
      </div>
    </div>`
    )
    .join('');
}

function applyEventFilters() {
  const loai = document.getElementById('filter-loai').value;
  let filtered = allEvents;
  if (loai) filtered = filtered.filter((e) => e.loai === loai);
  renderEventList(filtered);
}

async function loadEvents() {
  try {
    allEvents = await fetchAll('lich_hoat_dong');
    renderEventList(allEvents);
  } catch (e) {
    console.error(e);
    document.getElementById('event-list').innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải lịch hoạt động</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadEvents();
  document.getElementById('filter-loai').addEventListener('change', applyEventFilters);
});
