/* Xử lý form gửi kiến nghị (Supabase) */

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB - ảnh lưu trong Supabase Storage nên có thể để lớn hơn base64 cũ

async function loadThonOptions() {
  const select = document.getElementById('f-thon');
  if (!select) return;
  try {
    const list = await fetchAll('thon', { sort: 'ten_thon' });
    if (list.length === 0) {
      // fallback tĩnh nếu bảng trống - 9 thôn của xã Đam Rông 1
      const fallback = [
        'Thôn Trung Tâm', 'Thôn Thanh Bình', 'Thôn Phi Liêng', 'Thôn Dơng Glê',
        'Thôn Lăng Tô', 'Thôn Pul', 'Thôn Đạ Sơn', "Thôn Đạ K'Nàng", 'Thôn Păng Dung'
      ];
      fallback.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        select.appendChild(opt);
      });
      return;
    }
    list.forEach((t) => {
      const opt = document.createElement('option');
      opt.value = t.ten_thon;
      opt.textContent = t.ten_thon;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

async function generateMaTraCuu() {
  const year = new Date().getFullYear();
  try {
    const { data, error } = await supabaseClient.rpc('generate_ma_tra_cuu');
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('Không gọi được hàm sinh mã, dùng phương án dự phòng:', e);
    const seq = String(Date.now()).slice(-6);
    return `DR1-${year}-${seq}`;
  }
}

function showFormError(msg) {
  const el = document.getElementById('form-error');
  el.textContent = msg;
  el.classList.add('show');
  window.setTimeout(() => el.classList.remove('show'), 6000);
}

function bindFilePreview() {
  const fileInput = document.getElementById('f-file');
  const preview = document.getElementById('file-preview');
  if (!fileInput) return;
  fileInput.addEventListener('change', () => {
    preview.innerHTML = '';
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      preview.innerHTML = `<p class="helper-text" style="color:#a3690b;"><i class="fa-solid fa-triangle-exclamation"></i> Chỉ hỗ trợ đính kèm trực tiếp file ảnh. Với video/tài liệu, vui lòng dán đường dẫn (Google Drive, YouTube...) ở ô bên dưới.</p>`;
      fileInput.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      preview.innerHTML = `<p class="helper-text" style="color:#9c1c1c;"><i class="fa-solid fa-circle-exclamation"></i> Ảnh quá lớn (giới hạn 5MB). Vui lòng chọn ảnh nhỏ hơn.</p>`;
      fileInput.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" alt="Ảnh đính kèm" style="max-width:200px;border-radius:8px;border:1px solid #e4d4b0;">`;
  });
}

async function submitKienNghi(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const hoten = document.getElementById('f-hoten').value.trim();
  const sdt = document.getElementById('f-sdt').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const thon = document.getElementById('f-thon').value;
  const linhvuc = document.getElementById('f-linhvuc').value;
  const tieude = document.getElementById('f-tieude').value.trim();
  const noidung = document.getElementById('f-noidung').value.trim();
  const congkhai = document.getElementById('f-congkhai').checked;
  const linkDinhKem = document.getElementById('f-link').value.trim();
  const fileInput = document.getElementById('f-file');
  const file = fileInput && fileInput.files[0];

  if (!hoten || !thon || !linhvuc || !tieude || !noidung) {
    showFormError('Vui lòng điền đầy đủ các trường bắt buộc (có dấu *).');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';

  try {
    let hinhAnhDinhKem = '';
    if (file) {
      hinhAnhDinhKem = await uploadToStorage(file, 'kien-nghi');
    }

    const ma_tra_cuu = await generateMaTraCuu();
    const payload = {
      ma_tra_cuu,
      ho_ten: hoten,
      sdt,
      email,
      thon,
      linh_vuc: linhvuc,
      tieu_de: tieude,
      noi_dung: noidung,
      hinh_anh_dinh_kem: hinhAnhDinhKem,
      duong_dan_dinh_kem: linkDinhKem,
      trang_thai: 'Đã tiếp nhận',
      tra_loi: '',
      ngay_gui: new Date().toISOString(),
      cong_khai: congkhai
    };
    const { error } = await supabaseClient.from('kien_nghi').insert(payload);
    if (error) throw error;

    document.getElementById('kien-nghi-form').style.display = 'none';
    document.getElementById('result-box').style.display = 'block';
    document.getElementById('result-code').textContent = ma_tra_cuu;
  } catch (err) {
    console.error(err);
    showFormError('Có lỗi xảy ra khi gửi kiến nghị. Vui lòng thử lại.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Gửi kiến nghị';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadThonOptions().then(() => {
    const params = new URLSearchParams(window.location.search);
    const thon = params.get('thon');
    if (thon) {
      const select = document.getElementById('f-thon');
      if (select) select.value = thon;
    }
  });
  bindFilePreview();
  const form = document.getElementById('kien-nghi-form');
  if (form) form.addEventListener('submit', submitKienNghi);
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = document.getElementById('result-code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép';
        setTimeout(() => (copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Sao chép mã'), 2000);
      });
    });
  }
});
