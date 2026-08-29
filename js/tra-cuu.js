/* Xử lý tra cứu tiến độ kiến nghị bằng mã tra cứu (Supabase RPC) */

function renderStatusTimeline(status) {
  const steps = ['Đã tiếp nhận', 'Đang xử lý', 'Đã giải quyết'];
  const curIdx = steps.indexOf(status);
  return `
    <div class="status-timeline">
      ${steps
        .map((s, i) => {
          const active = i <= curIdx;
          const icon = i === 0 ? 'fa-inbox' : i === 1 ? 'fa-gears' : 'fa-circle-check';
          return `<div class="status-step ${active ? 'active' : ''}">
            <div class="dot"><i class="fa-solid ${icon}"></i></div>
            <span>${s}</span>
          </div>`;
        })
        .join('')}
    </div>
  `;
}

async function searchKienNghi() {
  const input = document.getElementById('search-code');
  const errorEl = document.getElementById('search-error');
  const resultArea = document.getElementById('result-area');
  errorEl.classList.remove('show');
  resultArea.innerHTML = '';

  const code = input.value.trim().toUpperCase();
  if (!code) {
    errorEl.textContent = 'Vui lòng nhập mã tra cứu.';
    errorEl.classList.add('show');
    return;
  }

  resultArea.innerHTML = `<div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i>Đang tra cứu...</div>`;

  try {
    const { data, error } = await supabaseClient.rpc('tra_cuu_kien_nghi', { p_ma_tra_cuu: code });
    if (error) throw error;
    const found = (data && data[0]) || null;
    if (!found) {
      resultArea.innerHTML = '';
      errorEl.textContent = 'Không tìm thấy kiến nghị với mã tra cứu này. Vui lòng kiểm tra lại.';
      errorEl.classList.add('show');
      return;
    }

    resultArea.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <i class="fa-solid fa-file-circle-check"></i>
          <h3>${escapeHtml(found.tieu_de)}</h3>
        </div>
        <div class="panel-body" style="padding:20px;">
          ${renderStatusTimeline(found.trang_thai)}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;font-size:13.5px;">
            <div><b>Mã tra cứu:</b> ${escapeHtml(found.ma_tra_cuu)}</div>
            <div><b>Trạng thái:</b> <span class="status-pill ${statusPillClass(found.trang_thai)}">${escapeHtml(found.trang_thai)}</span></div>
            <div><b>Thôn:</b> ${escapeHtml(found.thon)}</div>
            <div><b>Lĩnh vực:</b> ${escapeHtml(found.linh_vuc)}</div>
            <div><b>Ngày gửi:</b> ${formatDate(found.ngay_gui)}</div>
            <div><b>Ngày trả lời:</b> ${found.ngay_tra_loi ? formatDate(found.ngay_tra_loi) : 'Chưa có'}</div>
          </div>
          <div style="border-top:1.5px solid #f0e6cc;padding-top:14px;">
            <b>Nội dung kiến nghị:</b>
            <p style="color:#4a3a28;line-height:1.6;">${escapeHtml(found.noi_dung)}</p>
          </div>
          ${
            found.hinh_anh_dinh_kem
              ? `<div style="margin-top:12px;"><b>Ảnh đính kèm:</b><br><img src="${found.hinh_anh_dinh_kem}" alt="Ảnh đính kèm" style="max-width:260px;border-radius:10px;border:1px solid #e4d4b0;margin-top:6px;"></div>`
              : ''
          }
          ${
            found.duong_dan_dinh_kem
              ? `<div style="margin-top:12px;"><b>Tài liệu/Video đính kèm:</b> <a href="${escapeHtml(found.duong_dan_dinh_kem)}" target="_blank" rel="noopener" style="color:var(--red-700);font-weight:700;">${escapeHtml(found.duong_dan_dinh_kem)}</a></div>`
              : ''
          }
          ${
            found.tra_loi
              ? `<div style="background:#fbf7e9;border-radius:10px;padding:14px;margin-top:12px;">
                  <b style="color:#166a3a;"><i class="fa-solid fa-reply"></i> Trả lời của HĐND xã:</b>
                  <p style="color:#2a1a10;line-height:1.6;margin-top:8px;">${escapeHtml(found.tra_loi)}</p>
                </div>`
              : `<div style="background:#fff2da;border-radius:10px;padding:14px;margin-top:12px;color:#a3690b;font-size:13.5px;">
                  <i class="fa-solid fa-clock"></i> Kiến nghị đang được xử lý, chưa có phản hồi chính thức.
                </div>`
          }
        </div>
      </div>
    `;
  } catch (e) {
    console.error(e);
    resultArea.innerHTML = '';
    errorEl.textContent = 'Có lỗi khi tra cứu. Vui lòng thử lại sau.';
    errorEl.classList.add('show');
  }
}

/* Danh sách "Cử tri hỏi - HĐND trả lời" công khai (chỉ hiển thị các bản ghi cong_khai = true,
   RLS đã đảm bảo select công khai chỉ trả những bản ghi này cho khách chưa đăng nhập) */
async function loadPublicQA() {
  const mount = document.getElementById('public-qa-list');
  if (!mount) return;
  try {
    const publicList = await fetchAll('kien_nghi', { sort: '-ngay_gui' });
    if (publicList.length === 0) {
      mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-comment-slash"></i>Chưa có câu hỏi công khai nào</div>`;
      return;
    }
    mount.innerHTML = publicList
      .map(
        (k) => `
      <div class="doc-card">
        <div class="ic"><i class="fa-solid fa-circle-question"></i></div>
        <div class="body">
          <h4>${escapeHtml(k.tieu_de)}</h4>
          <div class="meta">
            <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(k.thon)}</span>
            <span><i class="fa-solid fa-calendar"></i> ${formatDate(k.ngay_gui)}</span>
            <span class="status-pill ${statusPillClass(k.trang_thai)}">${escapeHtml(k.trang_thai)}</span>
          </div>
          <p class="desc">${escapeHtml(k.noi_dung)}</p>
          ${
            k.tra_loi
              ? `<div style="background:#fbf7e9;border-radius:8px;padding:10px 12px;margin-top:8px;font-size:13px;">
                  <b style="color:#166a3a;">Trả lời:</b> ${escapeHtml(k.tra_loi)}
                </div>`
              : ''
          }
        </div>
      </div>`
      )
      .join('');
  } catch (e) {
    console.error(e);
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải dữ liệu</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('search-btn');
  if (btn) btn.addEventListener('click', searchKienNghi);
  const input = document.getElementById('search-code');
  if (input) input.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchKienNghi(); });
  loadPublicQA();

  // Nếu URL có ?code=xxx thì tự tra cứu
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code && input) {
    input.value = code;
    searchKienNghi();
  }
});
