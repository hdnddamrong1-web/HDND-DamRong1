/* Logic khu vực quản trị (Dashboard) - chỉ dành cho cán bộ đã đăng nhập (Supabase) */

let statusChart = null;
let linhvucChart = null;
let cachedKienNghi = [];

async function bootDashboard() {
  const ok = await guardAdminPage();
  if (!ok) return;
  initAdminHeader();
  initTabNav();
  loadOverview();

  document.getElementById('kn-filter-keyword').addEventListener('input', applyKnFilters);
  document.getElementById('kn-filter-status').addEventListener('change', applyKnFilters);

  document.getElementById('btn-add-vb').addEventListener('click', () => openVbModal(null));
  document.getElementById('form-vb').addEventListener('submit', submitVbForm);

  document.getElementById('btn-add-tt').addEventListener('click', () => openTtModal(null));
  document.getElementById('form-tt').addEventListener('submit', submitTtForm);
  initTtImageUpload();

  document.getElementById('btn-add-lhd').addEventListener('click', () => openLhdModal(null));
  document.getElementById('form-lhd').addEventListener('submit', submitLhdForm);

  bindModalClose('modal-kn', 'modal-kn-close');
  bindModalClose('modal-vb', 'modal-vb-close');
  bindModalClose('modal-tt', 'modal-tt-close');
  bindModalClose('modal-lhd', 'modal-lhd-close');
}

/* ---------- Header thông tin admin ---------- */
function initAdminHeader() {
  document.getElementById('admin-name').textContent = getAdminDisplayName();
  document.getElementById('admin-role').textContent = getAdminRole();
  document.getElementById('btn-logout-admin').addEventListener('click', logout);
}

/* ---------- Điều hướng tab ---------- */
function switchTab(tabName) {
  document.querySelectorAll('.tab-panel').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.admin-nav a[data-tab]').forEach((el) => el.classList.remove('active'));
  const panel = document.getElementById('tab-' + tabName);
  if (panel) panel.style.display = 'block';
  const navLink = document.querySelector(`.admin-nav a[data-tab="${tabName}"]`);
  if (navLink) navLink.classList.add('active');
  const titles = {
    'tong-quan': 'Tổng quan',
    'kien-nghi': 'Kiến nghị cử tri',
    'van-ban': 'Quản lý văn bản',
    'tin-tuc': 'Quản lý tin tức / hoạt động',
    'lich': 'Quản lý lịch hoạt động'
  };
  document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';
  document.getElementById('admin-sidebar').classList.remove('open');

  if (tabName === 'tong-quan') loadOverview();
  if (tabName === 'kien-nghi') loadKienNghiTable();
  if (tabName === 'van-ban') loadVanBanTable();
  if (tabName === 'tin-tuc') loadTinTucTable();
  if (tabName === 'lich') loadLichTable();
}

function initTabNav() {
  document.querySelectorAll('.admin-nav a[data-tab]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });
  document.getElementById('hamburger-admin').addEventListener('click', () => {
    document.getElementById('admin-sidebar').classList.toggle('open');
  });
}

/* ---------- TỔNG QUAN ---------- */
async function loadOverview() {
  try {
    const [kn, vb, tt] = await Promise.all([fetchAll('kien_nghi'), fetchAll('van_ban'), fetchAll('tin_tuc')]);
    cachedKienNghi = kn;
    document.getElementById('stat-kn-total').textContent = kn.length;
    document.getElementById('stat-kn-pending').textContent = kn.filter((k) => k.trang_thai !== 'Đã giải quyết').length;
    document.getElementById('stat-vb-total').textContent = vb.length;
    document.getElementById('stat-tt-total').textContent = tt.length;

    renderStatusChart(kn);
    renderLinhVucChart(kn);
  } catch (e) {
    console.error(e);
  }
}

function renderStatusChart(list) {
  const statuses = ['Đã tiếp nhận', 'Đang xử lý', 'Đã giải quyết'];
  const counts = statuses.map((s) => list.filter((k) => k.trang_thai === s).length);
  const ctx = document.getElementById('chart-status');
  if (statusChart) statusChart.destroy();
  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: statuses,
      datasets: [{ data: counts, backgroundColor: ['#1b5fbf', '#e07b1a', '#1e8a4c'] }]
    },
    options: { plugins: { legend: { position: 'bottom' } } }
  });
}

function renderLinhVucChart(list) {
  const map = {};
  list.forEach((k) => {
    const lv = k.linh_vuc || 'Khác';
    map[lv] = (map[lv] || 0) + 1;
  });
  const labels = Object.keys(map);
  const data = Object.values(map);
  const ctx = document.getElementById('chart-linhvuc');
  if (linhvucChart) linhvucChart.destroy();
  linhvucChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: 'Số lượng', data, backgroundColor: '#a3151c' }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
  });
}

/* ---------- KIẾN NGHỊ ---------- */
async function loadKienNghiTable() {
  const tbody = document.getElementById('kn-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    cachedKienNghi = await fetchAll('kien_nghi', { sort: '-ngay_gui' });
    renderKienNghiTable(cachedKienNghi);
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="8">Lỗi tải dữ liệu</td></tr>`;
  }
}

function renderKienNghiTable(list) {
  const tbody = document.getElementById('kn-table-body');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#a89474;">Không có kiến nghị nào</td></tr>`;
    return;
  }
  tbody.innerHTML = list
    .map(
      (k) => `
    <tr>
      <td><b>${escapeHtml(k.ma_tra_cuu)}</b></td>
      <td>${escapeHtml(k.ho_ten)}</td>
      <td>${escapeHtml(k.thon)}</td>
      <td>${escapeHtml(k.linh_vuc)}</td>
      <td>${escapeHtml(k.tieu_de)}</td>
      <td><span class="status-pill ${statusPillClass(k.trang_thai)}">${escapeHtml(k.trang_thai)}</span></td>
      <td>${formatDate(k.ngay_gui)}</td>
      <td><button class="icon-btn" onclick="openKnModal('${k.id}')" title="Xem / Trả lời"><i class="fa-solid fa-eye"></i></button></td>
    </tr>`
    )
    .join('');
}

function applyKnFilters() {
  const kw = document.getElementById('kn-filter-keyword').value.trim().toLowerCase();
  const status = document.getElementById('kn-filter-status').value;
  let filtered = cachedKienNghi;
  if (kw) {
    filtered = filtered.filter(
      (k) =>
        (k.ho_ten || '').toLowerCase().includes(kw) ||
        (k.tieu_de || '').toLowerCase().includes(kw) ||
        (k.ma_tra_cuu || '').toLowerCase().includes(kw)
    );
  }
  if (status) filtered = filtered.filter((k) => k.trang_thai === status);
  renderKienNghiTable(filtered);
}

function openKnModal(id) {
  const k = cachedKienNghi.find((x) => x.id === id);
  if (!k) return;
  const body = document.getElementById('modal-kn-body');
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13.5px;margin-bottom:14px;">
      <div><b>Mã tra cứu:</b> ${escapeHtml(k.ma_tra_cuu)}</div>
      <div><b>Ngày gửi:</b> ${formatDate(k.ngay_gui)}</div>
      <div><b>Họ tên:</b> ${escapeHtml(k.ho_ten)}</div>
      <div><b>SĐT:</b> ${escapeHtml(k.sdt)}</div>
      <div><b>Thôn:</b> ${escapeHtml(k.thon)}</div>
      <div><b>Lĩnh vực:</b> ${escapeHtml(k.linh_vuc)}</div>
    </div>
    <div class="form-group"><label>Tiêu đề</label><input class="form-control" value="${escapeHtml(k.tieu_de)}" disabled></div>
    <div class="form-group"><label>Nội dung kiến nghị</label><textarea class="form-control" disabled>${escapeHtml(k.noi_dung)}</textarea></div>
    ${
      k.hinh_anh_dinh_kem
        ? `<div class="form-group"><label>Ảnh đính kèm</label><br><img src="${k.hinh_anh_dinh_kem}" alt="Ảnh đính kèm" style="max-width:220px;border-radius:10px;border:1px solid #e4d4b0;"></div>`
        : ''
    }
    ${
      k.duong_dan_dinh_kem
        ? `<div class="form-group"><label>Tài liệu/Video đính kèm</label><br><a href="${escapeHtml(k.duong_dan_dinh_kem)}" target="_blank" rel="noopener" style="color:var(--red-700);font-weight:700;">${escapeHtml(k.duong_dan_dinh_kem)}</a></div>`
        : ''
    }
    <div class="form-group">
      <label>Trạng thái xử lý</label>
      <select class="form-control" id="kn-modal-status">
        <option ${k.trang_thai === 'Đã tiếp nhận' ? 'selected' : ''}>Đã tiếp nhận</option>
        <option ${k.trang_thai === 'Đang xử lý' ? 'selected' : ''}>Đang xử lý</option>
        <option ${k.trang_thai === 'Đã giải quyết' ? 'selected' : ''}>Đã giải quyết</option>
      </select>
    </div>
    <div class="form-group"><label>Nội dung trả lời</label><textarea class="form-control" id="kn-modal-traloi">${escapeHtml(k.tra_loi || '')}</textarea></div>
    <div class="form-group"><label style="display:flex;gap:8px;align-items:center;font-weight:600;"><input type="checkbox" id="kn-modal-congkhai" ${k.cong_khai ? 'checked' : ''} style="width:auto;"> Hiển thị công khai ở mục "Cử tri hỏi - HĐND trả lời"</label></div>
    <div style="display:flex;gap:10px;">
      <button class="btn-submit" id="kn-modal-save" style="flex:1;"><i class="fa-solid fa-floppy-disk"></i> Lưu cập nhật</button>
      <button type="button" id="kn-modal-delete" style="flex:0 0 auto;background:#b3261e;color:#fff;border:none;border-radius:8px;padding:0 18px;font-weight:700;cursor:pointer;"><i class="fa-solid fa-trash"></i> Xoá</button>
    </div>
  `;
  document.getElementById('kn-modal-save').addEventListener('click', () => saveKnUpdate(k.id));
  document.getElementById('kn-modal-delete').addEventListener('click', () => deleteKnRecord(k.id));
  document.getElementById('modal-kn').classList.add('open');
}

async function deleteKnRecord(id) {
  const k = cachedKienNghi.find((x) => x.id === id);
  const label = k ? `"${k.tieu_de}" (${k.ma_tra_cuu})` : 'kiến nghị này';
  if (!confirm(`Bạn có chắc muốn XOÁ VĨNH VIỄN ${label}? Hành động này không thể hoàn tác.`)) return;
  try {
    const { error } = await supabaseClient.from('kien_nghi').delete().eq('id', id);
    if (error) throw error;
    document.getElementById('modal-kn').classList.remove('open');
    loadKienNghiTable();
    loadOverview();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi xoá kiến nghị.');
  }
}

async function saveKnUpdate(id) {
  const status = document.getElementById('kn-modal-status').value;
  const traloi = document.getElementById('kn-modal-traloi').value;
  const congkhai = document.getElementById('kn-modal-congkhai').checked;
  const payload = { trang_thai: status, tra_loi: traloi, cong_khai: congkhai };
  if (traloi && status !== 'Đã tiếp nhận') payload.ngay_tra_loi = new Date().toISOString();
  try {
    const { error } = await supabaseClient.from('kien_nghi').update(payload).eq('id', id);
    if (error) throw error;
    document.getElementById('modal-kn').classList.remove('open');
    loadKienNghiTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi lưu cập nhật.');
  }
}

/* ---------- VĂN BẢN ---------- */
let cachedVanBan = [];
async function loadVanBanTable() {
  const tbody = document.getElementById('vb-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    cachedVanBan = await fetchAll('van_ban', { sort: '-ngay_ban_hanh' });
    tbody.innerHTML = cachedVanBan.length
      ? cachedVanBan
          .map(
            (d) => `
      <tr>
        <td>${escapeHtml(d.tieu_de)}</td>
        <td>${escapeHtml(d.so_hieu || '')}</td>
        <td><span class="tag-pill">${escapeHtml(d.loai)}</span></td>
        <td>${formatDate(d.ngay_ban_hanh)}</td>
        <td>
          <button class="icon-btn" onclick="openVbModal('${d.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" onclick="deleteRecord('van_ban','${d.id}', loadVanBanTable)" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="text-align:center;padding:20px;color:#a89474;">Chưa có văn bản nào</td></tr>`;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5">Lỗi tải dữ liệu</td></tr>`;
  }
}

function openVbModal(id) {
  document.getElementById('form-vb').reset();
  document.getElementById('modal-vb-title').innerHTML = id ? '<i class="fa-solid fa-file-lines"></i> Sửa văn bản' : '<i class="fa-solid fa-file-lines"></i> Thêm văn bản';
  document.getElementById('vb-id').value = id || '';
  if (id) {
    const d = cachedVanBan.find((x) => x.id === id);
    if (d) {
      document.getElementById('vb-tieude').value = d.tieu_de || '';
      document.getElementById('vb-sohieu').value = d.so_hieu || '';
      document.getElementById('vb-loai').value = d.loai || 'Nghị quyết';
      document.getElementById('vb-ngay').value = d.ngay_ban_hanh ? new Date(d.ngay_ban_hanh).toISOString().slice(0, 10) : '';
      document.getElementById('vb-mota').value = d.mo_ta || '';
    }
  }
  document.getElementById('modal-vb').classList.add('open');
}

async function submitVbForm(e) {
  e.preventDefault();
  const id = document.getElementById('vb-id').value;
  const payload = {
    tieu_de: document.getElementById('vb-tieude').value.trim(),
    so_hieu: document.getElementById('vb-sohieu').value.trim(),
    loai: document.getElementById('vb-loai').value,
    ngay_ban_hanh: new Date(document.getElementById('vb-ngay').value).toISOString(),
    mo_ta: document.getElementById('vb-mota').value.trim()
  };
  try {
    if (id) {
      const { error } = await supabaseClient.from('van_ban').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('van_ban').insert(payload);
      if (error) throw error;
    }
    document.getElementById('modal-vb').classList.remove('open');
    loadVanBanTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi lưu văn bản.');
  }
}

/* ---------- TIN TỨC ---------- */
let cachedTinTuc = [];
async function loadTinTucTable() {
  const tbody = document.getElementById('tt-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    cachedTinTuc = await fetchAll('tin_tuc', { sort: '-ngay' });
    tbody.innerHTML = cachedTinTuc.length
      ? cachedTinTuc
          .map(
            (t) => `
      <tr>
        <td>${escapeHtml(t.tieu_de)}</td>
        <td><span class="tag-pill">${escapeHtml(t.loai)}</span></td>
        <td>${formatDate(t.ngay)}</td>
        <td>${t.noi_bat ? '<i class="fa-solid fa-star" style="color:var(--gold-500);"></i>' : ''}</td>
        <td>
          <button class="icon-btn" onclick="openTtModal('${t.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" onclick="deleteRecord('tin_tuc','${t.id}', loadTinTucTable)" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="text-align:center;padding:20px;color:#a89474;">Chưa có bài viết nào</td></tr>`;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5">Lỗi tải dữ liệu</td></tr>`;
  }
}

function renderTtImagePreview(url) {
  const preview = document.getElementById('tt-image-preview');
  if (!preview) return;
  preview.innerHTML = url
    ? `<img src="${url}" alt="Xem trước ảnh" style="max-width:220px;border-radius:8px;border:1px solid #e4d4b0;">`
    : '';
}

function openTtModal(id) {
  document.getElementById('form-tt').reset();
  document.getElementById('modal-tt-title').innerHTML = id ? '<i class="fa-solid fa-newspaper"></i> Sửa bài viết' : '<i class="fa-solid fa-newspaper"></i> Thêm bài viết';
  document.getElementById('tt-id').value = id || '';
  renderTtImagePreview('');
  if (id) {
    const t = cachedTinTuc.find((x) => x.id === id);
    if (t) {
      document.getElementById('tt-tieude').value = t.tieu_de || '';
      document.getElementById('tt-loai').value = t.loai || 'Tin tức';
      document.getElementById('tt-ngay').value = t.ngay ? new Date(t.ngay).toISOString().slice(0, 10) : '';
      document.getElementById('tt-hinhanh').value = t.hinh_anh || '';
      document.getElementById('tt-mota').value = t.mo_ta || '';
      document.getElementById('tt-noidung').value = t.noi_dung || '';
      document.getElementById('tt-noibat').checked = !!t.noi_bat;
      renderTtImagePreview(t.hinh_anh || '');
    }
  }
  document.getElementById('modal-tt').classList.add('open');
}

function initTtImageUpload() {
  const uploadBtn = document.getElementById('tt-upload-btn');
  const fileInput = document.getElementById('tt-file-input');
  const urlInput = document.getElementById('tt-hinhanh');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh.');
      fileInput.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh quá lớn (giới hạn 5MB). Vui lòng chọn ảnh nhỏ hơn hoặc dán URL ảnh có sẵn.');
      fileInput.value = '';
      return;
    }
    const originalHtml = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    try {
      const url = await uploadToStorage(file, 'tin-tuc');
      urlInput.value = url;
      renderTtImagePreview(url);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi tải ảnh lên.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalHtml;
      fileInput.value = '';
    }
  });

  urlInput.addEventListener('input', () => renderTtImagePreview(urlInput.value.trim()));
}

async function submitTtForm(e) {
  e.preventDefault();
  const id = document.getElementById('tt-id').value;
  const payload = {
    tieu_de: document.getElementById('tt-tieude').value.trim(),
    loai: document.getElementById('tt-loai').value,
    ngay: new Date(document.getElementById('tt-ngay').value).toISOString(),
    hinh_anh: document.getElementById('tt-hinhanh').value.trim(),
    mo_ta: document.getElementById('tt-mota').value.trim(),
    noi_dung: document.getElementById('tt-noidung').value.trim(),
    noi_bat: document.getElementById('tt-noibat').checked
  };
  try {
    if (id) {
      const { error } = await supabaseClient.from('tin_tuc').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('tin_tuc').insert(payload);
      if (error) throw error;
    }
    document.getElementById('modal-tt').classList.remove('open');
    loadTinTucTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi lưu bài viết.');
  }
}

/* ---------- LỊCH HOẠT ĐỘNG ---------- */
let cachedLhd = [];
async function loadLichTable() {
  const tbody = document.getElementById('lhd-table-body');
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    cachedLhd = await fetchAll('lich_hoat_dong');
    cachedLhd.sort((a, b) => new Date(b.ngay) - new Date(a.ngay));
    tbody.innerHTML = cachedLhd.length
      ? cachedLhd
          .map(
            (l) => `
      <tr>
        <td>${escapeHtml(l.tieu_de)}</td>
        <td><span class="tag-pill">${escapeHtml(l.loai)}</span></td>
        <td>${formatDate(l.ngay)}</td>
        <td>${escapeHtml(l.dia_diem || '')}</td>
        <td>
          <button class="icon-btn" onclick="openLhdModal('${l.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" onclick="deleteRecord('lich_hoat_dong','${l.id}', loadLichTable)" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="5" style="text-align:center;padding:20px;color:#a89474;">Chưa có hoạt động nào</td></tr>`;
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5">Lỗi tải dữ liệu</td></tr>`;
  }
}

function openLhdModal(id) {
  document.getElementById('form-lhd').reset();
  document.getElementById('modal-lhd-title').innerHTML = id ? '<i class="fa-solid fa-calendar-days"></i> Sửa hoạt động' : '<i class="fa-solid fa-calendar-days"></i> Thêm hoạt động';
  document.getElementById('lhd-id').value = id || '';
  if (id) {
    const l = cachedLhd.find((x) => x.id === id);
    if (l) {
      document.getElementById('lhd-tieude').value = l.tieu_de || '';
      document.getElementById('lhd-loai').value = l.loai || 'Kỳ họp';
      document.getElementById('lhd-ngay').value = l.ngay ? new Date(l.ngay).toISOString().slice(0, 10) : '';
      document.getElementById('lhd-diadiem').value = l.dia_diem || '';
      document.getElementById('lhd-noidung').value = l.noi_dung || '';
    }
  }
  document.getElementById('modal-lhd').classList.add('open');
}

async function submitLhdForm(e) {
  e.preventDefault();
  const id = document.getElementById('lhd-id').value;
  const payload = {
    tieu_de: document.getElementById('lhd-tieude').value.trim(),
    loai: document.getElementById('lhd-loai').value,
    ngay: new Date(document.getElementById('lhd-ngay').value).toISOString(),
    dia_diem: document.getElementById('lhd-diadiem').value.trim(),
    noi_dung: document.getElementById('lhd-noidung').value.trim()
  };
  try {
    if (id) {
      const { error } = await supabaseClient.from('lich_hoat_dong').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('lich_hoat_dong').insert(payload);
      if (error) throw error;
    }
    document.getElementById('modal-lhd').classList.remove('open');
    loadLichTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi lưu hoạt động.');
  }
}

/* ---------- Xóa dùng chung ---------- */
async function deleteRecord(table, id, reloadFn) {
  if (!confirm('Bạn có chắc muốn xóa mục này?')) return;
  try {
    const { error } = await supabaseClient.from(table).delete().eq('id', id);
    if (error) throw error;
    if (reloadFn) reloadFn();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi xóa.');
  }
}

/* ---------- Đóng modal ---------- */
function bindModalClose(overlayId, closeId) {
  const overlay = document.getElementById(overlayId);
  const closeBtn = document.getElementById(closeId);
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
}

document.addEventListener('DOMContentLoaded', bootDashboard);
