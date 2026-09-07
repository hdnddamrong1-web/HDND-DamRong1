/* Logic khu vực quản trị (Dashboard) - chỉ dành cho cán bộ đã đăng nhập (Supabase) */

let statusChart = null;
let linhvucChart = null;
let cachedKienNghi = [];

async function bootDashboard() {
  const ok = await guardStaffPage();
  if (!ok) return;
  initAdminHeader();
  initTabNav();
  loadOverview();

  document.getElementById('kn-filter-keyword').addEventListener('input', applyKnFilters);
  document.getElementById('kn-filter-status').addEventListener('change', applyKnFilters);

  document.getElementById('btn-add-vb').addEventListener('click', () => openVbModal(null));
  document.getElementById('form-vb').addEventListener('submit', submitVbForm);
  initVbFileUpload();

  document.getElementById('btn-add-tt').addEventListener('click', () => openTtModal(null));
  document.getElementById('form-tt').addEventListener('submit', submitTtForm);
  initTtImageUpload();
  initTtGalleryUpload();

  document.getElementById('btn-add-lhd').addEventListener('click', () => openLhdModal(null));
  document.getElementById('form-lhd').addEventListener('submit', submitLhdForm);

  document.getElementById('btn-add-dt').addEventListener('click', () => openDtModal(null));
  document.getElementById('form-dt').addEventListener('submit', submitDtForm);
  document.getElementById('form-banhanh').addEventListener('submit', submitBanHanhForm);
  initDtFileUpload();
  initBhFileUpload();
  document.getElementById('btn-export-excel').addEventListener('click', exportYkienExcel);
  document.getElementById('btn-export-word').addEventListener('click', exportYkienWord);

  bindModalClose('modal-kn', 'modal-kn-close');
  bindModalClose('modal-vb', 'modal-vb-close');
  bindModalClose('modal-tt', 'modal-tt-close');
  bindModalClose('modal-lhd', 'modal-lhd-close');
  bindModalClose('modal-dt', 'modal-dt-close');
  bindModalClose('modal-ykien-list', 'modal-ykien-list-close');
  bindModalClose('modal-banhanh', 'modal-banhanh-close');
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
    'lich': 'Quản lý lịch hoạt động',
    'dai-bieu': 'Dự thảo & Ý kiến đại biểu'
  };
  document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';
  document.getElementById('admin-sidebar').classList.remove('open');

  if (tabName === 'tong-quan') loadOverview();
  if (tabName === 'kien-nghi') loadKienNghiTable();
  if (tabName === 'van-ban') loadVanBanTable();
  if (tabName === 'tin-tuc') loadTinTucTable();
  if (tabName === 'lich') loadLichTable();
  if (tabName === 'dai-bieu') loadDtTable();
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

function renderVbFilePreview(url) {
  const preview = document.getElementById('vb-file-preview');
  if (!preview) return;
  preview.innerHTML = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:var(--red-700);font-weight:700;"><i class="fa-solid fa-file-arrow-down"></i> Xem file đã tải</a>`
    : '';
}

function openVbModal(id) {
  document.getElementById('form-vb').reset();
  document.getElementById('modal-vb-title').innerHTML = id ? '<i class="fa-solid fa-file-lines"></i> Sửa văn bản' : '<i class="fa-solid fa-file-lines"></i> Thêm văn bản';
  document.getElementById('vb-id').value = id || '';
  renderVbFilePreview('');
  if (id) {
    const d = cachedVanBan.find((x) => x.id === id);
    if (d) {
      document.getElementById('vb-tieude').value = d.tieu_de || '';
      document.getElementById('vb-sohieu').value = d.so_hieu || '';
      document.getElementById('vb-loai').value = d.loai || 'Nghị quyết';
      document.getElementById('vb-ngay').value = d.ngay_ban_hanh ? new Date(d.ngay_ban_hanh).toISOString().slice(0, 10) : '';
      document.getElementById('vb-mota').value = d.mo_ta || '';
      document.getElementById('vb-file').value = d.file_url || '';
      renderVbFilePreview(d.file_url || '');
    }
  }
  document.getElementById('modal-vb').classList.add('open');
}

function initVbFileUpload() {
  const uploadBtn = document.getElementById('vb-upload-btn');
  const fileInput = document.getElementById('vb-file-input');
  const urlInput = document.getElementById('vb-file');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn (giới hạn 10MB). Vui lòng chọn file nhỏ hơn hoặc dán URL file có sẵn.');
      fileInput.value = '';
      return;
    }
    const originalHtml = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    try {
      const url = await uploadToStorage(file, 'van-ban');
      urlInput.value = url;
      renderVbFilePreview(url);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi tải file lên.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalHtml;
      fileInput.value = '';
    }
  });

  urlInput.addEventListener('input', () => renderVbFilePreview(urlInput.value.trim()));
}

async function submitVbForm(e) {
  e.preventDefault();
  const id = document.getElementById('vb-id').value;
  const payload = {
    tieu_de: document.getElementById('vb-tieude').value.trim(),
    so_hieu: document.getElementById('vb-sohieu').value.trim(),
    loai: document.getElementById('vb-loai').value,
    ngay_ban_hanh: new Date(document.getElementById('vb-ngay').value).toISOString(),
    mo_ta: document.getElementById('vb-mota').value.trim(),
    file_url: document.getElementById('vb-file').value.trim()
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

let cachedTtGallery = [];

function renderTtGalleryPreview() {
  const preview = document.getElementById('tt-gallery-preview');
  if (!preview) return;
  preview.innerHTML = cachedTtGallery
    .map(
      (url, idx) => `
    <div style="position:relative;">
      <img src="${url}" alt="Ảnh phụ" style="width:90px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #e4d4b0;">
      <button type="button" onclick="removeTtGalleryImage(${idx})" style="position:absolute;top:-8px;right:-8px;background:#b3261e;color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-weight:700;">&times;</button>
    </div>`
    )
    .join('');
}

function removeTtGalleryImage(idx) {
  cachedTtGallery.splice(idx, 1);
  renderTtGalleryPreview();
}

function initTtGalleryUpload() {
  const uploadBtn = document.getElementById('tt-gallery-upload-btn');
  const fileInput = document.getElementById('tt-gallery-input');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    if (files.length === 0) return;
    const originalHtml = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" quá lớn (giới hạn 5MB), đã bỏ qua.`);
        continue;
      }
      uploadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải ${file.name}...`;
      try {
        const url = await uploadToStorage(file, 'tin-tuc');
        cachedTtGallery.push(url);
        renderTtGalleryPreview();
      } catch (e) {
        console.error(e);
        alert(`Có lỗi khi tải ảnh "${file.name}" lên.`);
      }
    }
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = originalHtml;
    fileInput.value = '';
  });
}

function openTtModal(id) {
  document.getElementById('form-tt').reset();
  document.getElementById('modal-tt-title').innerHTML = id ? '<i class="fa-solid fa-newspaper"></i> Sửa bài viết' : '<i class="fa-solid fa-newspaper"></i> Thêm bài viết';
  document.getElementById('tt-id').value = id || '';
  renderTtImagePreview('');
  cachedTtGallery = [];
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
      cachedTtGallery = Array.isArray(t.hinh_anh_phu) ? [...t.hinh_anh_phu] : [];
    }
  }
  renderTtGalleryPreview();
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
    noi_bat: document.getElementById('tt-noibat').checked,
    hinh_anh_phu: cachedTtGallery
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

/* ---------- DỰ THẢO & Ý KIẾN ĐẠI BIỂU ---------- */
let cachedDrafts = [];
let cachedYkiens = [];

async function loadDtTable() {
  const tbody = document.getElementById('dt-table-body');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    const [drafts, ykiens] = await Promise.all([
      fetchAll('van_ban_du_thao', { sort: '-created_at' }),
      fetchAll('y_kien_dong_gop')
    ]);
    cachedDrafts = drafts;
    cachedYkiens = ykiens;
    renderDtTable();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="6">Lỗi tải dữ liệu (có thể chưa tạo bảng van_ban_du_thao / y_kien_dong_gop trên Supabase)</td></tr>`;
  }
}

function isDtLocked(d) {
  if (d.khoa_gop_y) return true;
  if (d.han_gop_y && new Date(d.han_gop_y).getTime() < Date.now()) return true;
  return false;
}

function renderDtTable() {
  const tbody = document.getElementById('dt-table-body');
  if (cachedDrafts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#a89474;">Chưa có văn bản dự thảo nào</td></tr>`;
    return;
  }
  tbody.innerHTML = cachedDrafts
    .map((d) => {
      const count = cachedYkiens.filter((y) => y.van_ban_du_thao_id === d.id).length;
      const locked = isDtLocked(d);
      return `
      <tr>
        <td>${escapeHtml(d.tieu_de)}</td>
        <td>${d.han_gop_y ? formatDate(d.han_gop_y) : '<span style="color:#a89474;">Chưa đặt</span>'}</td>
        <td>${locked ? '<span class="status-pill" style="background:#fde3e3;color:#9c1c1c;">Đã khoá</span>' : '<span class="status-pill status-done">Đang mở</span>'}</td>
        <td><button class="icon-btn" onclick="openYkienListModal('${d.id}')" title="Xem ý kiến"><i class="fa-solid fa-comments"></i> ${count}</button></td>
        <td>${d.da_ban_hanh ? '<i class="fa-solid fa-circle-check" style="color:var(--green-600);"></i> Rồi' : '<span style="color:#a89474;">Chưa</span>'}</td>
        <td>
          <button class="icon-btn" onclick="openDtModal('${d.id}')" title="Sửa"><i class="fa-solid fa-pen"></i></button>
          <button class="icon-btn" onclick="toggleDtLock('${d.id}')" title="${locked ? 'Mở khoá góp ý' : 'Khoá góp ý'}"><i class="fa-solid ${locked ? 'fa-lock-open' : 'fa-lock'}"></i></button>
          ${!d.da_ban_hanh ? `<button class="icon-btn" onclick="openBanHanhModal('${d.id}')" title="Đăng ban hành chính thức"><i class="fa-solid fa-stamp"></i></button>` : ''}
          <button class="icon-btn" onclick="deleteRecord('van_ban_du_thao','${d.id}', loadDtTable)" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>`;
    })
    .join('');
}

async function toggleDtLock(id) {
  const d = cachedDrafts.find((x) => x.id === id);
  if (!d) return;
  const newVal = !d.khoa_gop_y;
  try {
    const { error } = await supabaseClient.from('van_ban_du_thao').update({ khoa_gop_y: newVal }).eq('id', id);
    if (error) throw error;
    loadDtTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi cập nhật trạng thái khoá góp ý.');
  }
}

function renderDtFilePreview(url) {
  const preview = document.getElementById('dt-file-preview');
  if (!preview) return;
  preview.innerHTML = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:var(--red-700);font-weight:700;"><i class="fa-solid fa-file-arrow-down"></i> Xem file đã tải</a>`
    : '';
}

function openDtModal(id) {
  document.getElementById('form-dt').reset();
  document.getElementById('modal-dt-title').innerHTML = id ? '<i class="fa-solid fa-file-lines"></i> Sửa văn bản dự thảo' : '<i class="fa-solid fa-file-lines"></i> Thêm văn bản dự thảo';
  document.getElementById('dt-id').value = id || '';
  renderDtFilePreview('');
  if (id) {
    const d = cachedDrafts.find((x) => x.id === id);
    if (d) {
      document.getElementById('dt-tieude').value = d.tieu_de || '';
      document.getElementById('dt-mota').value = d.mo_ta || '';
      document.getElementById('dt-file').value = d.file_url || '';
      renderDtFilePreview(d.file_url || '');
      document.getElementById('dt-han').value = d.han_gop_y ? new Date(d.han_gop_y).toISOString().slice(0, 16) : '';
      document.getElementById('dt-khoa').checked = !!d.khoa_gop_y;
    }
  }
  document.getElementById('modal-dt').classList.add('open');
}

function initDtFileUpload() {
  const uploadBtn = document.getElementById('dt-upload-btn');
  const fileInput = document.getElementById('dt-file-input');
  const urlInput = document.getElementById('dt-file');
  if (!uploadBtn || !fileInput) return;
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn (giới hạn 10MB).');
      fileInput.value = '';
      return;
    }
    const originalHtml = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    try {
      const url = await uploadToStorage(file, 'du-thao');
      urlInput.value = url;
      renderDtFilePreview(url);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi tải file lên.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalHtml;
      fileInput.value = '';
    }
  });
  urlInput.addEventListener('input', () => renderDtFilePreview(urlInput.value.trim()));
}

async function submitDtForm(e) {
  e.preventDefault();
  const id = document.getElementById('dt-id').value;
  const hanVal = document.getElementById('dt-han').value;
  const payload = {
    tieu_de: document.getElementById('dt-tieude').value.trim(),
    mo_ta: document.getElementById('dt-mota').value.trim(),
    file_url: document.getElementById('dt-file').value.trim(),
    han_gop_y: hanVal ? new Date(hanVal).toISOString() : null,
    khoa_gop_y: document.getElementById('dt-khoa').checked
  };
  try {
    if (id) {
      const { error } = await supabaseClient.from('van_ban_du_thao').update(payload).eq('id', id);
      if (error) throw error;
    } else {
      payload.da_ban_hanh = false;
      const { error } = await supabaseClient.from('van_ban_du_thao').insert(payload);
      if (error) throw error;
    }
    document.getElementById('modal-dt').classList.remove('open');
    loadDtTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi lưu văn bản dự thảo.');
  }
}

/* ---------- Xem / xuất ý kiến đóng góp ---------- */
let currentYkienDraft = null;

function openYkienListModal(draftId) {
  const d = cachedDrafts.find((x) => x.id === draftId);
  if (!d) return;
  currentYkienDraft = d;
  const list = cachedYkiens.filter((y) => y.van_ban_du_thao_id === draftId);
  document.getElementById('modal-ykien-list-title').innerHTML = `<i class="fa-solid fa-comments"></i> Ý kiến đóng góp: ${escapeHtml(d.tieu_de)}`;
  const body = document.getElementById('ykien-list-body');
  body.innerHTML = list.length
    ? list
        .map(
          (y) => `
    <div style="border-bottom:1px solid var(--cream-200);padding:12px 0;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">
        <b style="color:var(--red-800);">${escapeHtml(y.dai_bieu_ten || y.dai_bieu_email)}</b>
        <span style="font-size:12px;color:#8a7355;">${y.ngay_sua ? 'Sửa lần cuối: ' + formatDate(y.ngay_sua) : 'Gửi: ' + formatDate(y.ngay_gui)}</span>
      </div>
      <p style="margin:6px 0 0;font-size:13.5px;white-space:pre-wrap;">${escapeHtml(y.noi_dung)}</p>
    </div>`
        )
        .join('')
    : `<div class="empty-state"><i class="fa-solid fa-comment-slash"></i>Chưa có ý kiến đóng góp nào</div>`;
  document.getElementById('modal-ykien-list').classList.add('open');
}

function exportYkienExcel() {
  if (!currentYkienDraft) return;
  const list = cachedYkiens.filter((y) => y.van_ban_du_thao_id === currentYkienDraft.id);
  if (list.length === 0) {
    alert('Chưa có ý kiến nào để xuất.');
    return;
  }
  const csvEscape = (s) => `"${String(s || '').replace(/"/g, '""')}"`;
  const rows = [['Đại biểu', 'Email', 'Ngày gửi', 'Ngày sửa', 'Nội dung ý kiến']];
  list.forEach((y) => {
    rows.push([y.dai_bieu_ten || '', y.dai_bieu_email || '', formatDate(y.ngay_gui), y.ngay_sua ? formatDate(y.ngay_sua) : '', y.noi_dung || '']);
  });
  const csvContent = '\uFEFF' + rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `y-kien-dong-gop-${(currentYkienDraft.tieu_de || 'van-ban').replace(/[^\w\u00C0-\u1EF9]+/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportYkienWord() {
  if (!currentYkienDraft) return;
  const list = cachedYkiens.filter((y) => y.van_ban_du_thao_id === currentYkienDraft.id);
  if (list.length === 0) {
    alert('Chưa có ý kiến nào để xuất.');
    return;
  }
  const itemsHtml = list
    .map(
      (y) => `
    <p><b>${escapeHtml(y.dai_bieu_ten || y.dai_bieu_email)}</b> (${y.ngay_sua ? 'sửa: ' + formatDate(y.ngay_sua) : 'gửi: ' + formatDate(y.ngay_gui)})</p>
    <p style="margin:0 0 14px;white-space:pre-wrap;">${escapeHtml(y.noi_dung)}</p>`
    )
    .join('<hr>');
  const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
    <h2>TỔNG HỢP Ý KIẾN ĐÓNG GÓP</h2>
    <h3>${escapeHtml(currentYkienDraft.tieu_de)}</h3>
    ${itemsHtml}
  </body></html>`;
  const blob = new Blob(['\uFEFF' + htmlDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `y-kien-dong-gop-${(currentYkienDraft.tieu_de || 'van-ban').replace(/[^\w\u00C0-\u1EF9]+/g, '-')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------- Đăng ban hành chính thức (dự thảo -> văn bản công khai) ---------- */
function renderBhFilePreview(url) {
  const preview = document.getElementById('bh-file-preview');
  if (!preview) return;
  preview.innerHTML = url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener" style="color:var(--red-700);font-weight:700;"><i class="fa-solid fa-file-arrow-down"></i> Xem file đã tải</a>`
    : '';
}

function openBanHanhModal(draftId) {
  const d = cachedDrafts.find((x) => x.id === draftId);
  if (!d) return;
  document.getElementById('form-banhanh').reset();
  document.getElementById('bh-draft-id').value = draftId;
  document.getElementById('bh-tieude').value = d.tieu_de || '';
  document.getElementById('bh-mota').value = d.mo_ta || '';
  document.getElementById('bh-file').value = '';
  renderBhFilePreview('');
  document.getElementById('bh-ngay').value = new Date().toISOString().slice(0, 10);
  document.getElementById('modal-banhanh').classList.add('open');
}

function initBhFileUpload() {
  const uploadBtn = document.getElementById('bh-upload-btn');
  const fileInput = document.getElementById('bh-file-input');
  const urlInput = document.getElementById('bh-file');
  if (!uploadBtn || !fileInput) return;
  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File quá lớn (giới hạn 10MB).');
      fileInput.value = '';
      return;
    }
    const originalHtml = uploadBtn.innerHTML;
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    try {
      const url = await uploadToStorage(file, 'van-ban');
      urlInput.value = url;
      renderBhFilePreview(url);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi tải file lên.');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = originalHtml;
      fileInput.value = '';
    }
  });
  urlInput.addEventListener('input', () => renderBhFilePreview(urlInput.value.trim()));
}

async function submitBanHanhForm(e) {
  e.preventDefault();
  const draftId = document.getElementById('bh-draft-id').value;
  const payload = {
    tieu_de: document.getElementById('bh-tieude').value.trim(),
    so_hieu: document.getElementById('bh-sohieu').value.trim(),
    loai: document.getElementById('bh-loai').value,
    ngay_ban_hanh: new Date(document.getElementById('bh-ngay').value).toISOString(),
    mo_ta: document.getElementById('bh-mota').value.trim(),
    file_url: document.getElementById('bh-file').value.trim()
  };
  try {
    const { data, error } = await supabaseClient.from('van_ban').insert(payload).select();
    if (error) throw error;
    const newId = data && data[0] ? data[0].id : null;
    const { error: err2 } = await supabaseClient
      .from('van_ban_du_thao')
      .update({ da_ban_hanh: true, van_ban_chinh_thuc_id: newId, khoa_gop_y: true })
      .eq('id', draftId);
    if (err2) throw err2;
    document.getElementById('modal-banhanh').classList.remove('open');
    alert('Đã đăng văn bản chính thức lên trang công khai "Văn bản". Góp ý cho dự thảo này cũng tự động được khoá lại.');
    loadDtTable();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi đăng văn bản chính thức.');
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
