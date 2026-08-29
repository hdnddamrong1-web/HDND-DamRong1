/* Sinh mã QR cho từng thôn, dẫn tới trang gửi kiến nghị */

async function renderQrGrid() {
  const mount = document.getElementById('qr-grid');
  if (!mount) return;
  try {
    let list = await fetchAll('thon', { sort: 'ten_thon' });
    if (list.length === 0) {
      list = [
        'Thôn Trung Tâm', 'Thôn Thanh Bình', 'Thôn Phi Liêng', 'Thôn Dơng Glê',
        'Thôn Lăng Tô', 'Thôn Pul', 'Thôn Đạ Sơn', "Thôn Đạ K'Nàng", 'Thôn Păng Dung'
      ].map(
        (t, idx) => ({ id: 'x' + idx, ten_thon: t, ma_thon: 'DR1-0' + (idx + 1) })
      );
    }
    mount.innerHTML = list
      .map(
        (t) => `
      <div class="qr-card">
        <div class="qr-canvas-box" id="qr-${escapeHtml(t.id)}"></div>
        <h4>${escapeHtml(t.ten_thon)}</h4>
        <span>Mã: ${escapeHtml(t.ma_thon || '')}</span>
      </div>`
      )
      .join('');

    list.forEach((t) => {
      const box = document.getElementById(`qr-${t.id}`);
      if (box && window.QRCode) {
        const url = `${window.location.origin}${window.location.pathname.replace('qr-thon.html', '')}gui-kien-nghi.html?thon=${encodeURIComponent(t.ten_thon)}`;
        new window.QRCode(box, {
          text: url,
          width: 150,
          height: 150,
          colorDark: '#7a0d13',
          colorLight: '#ffffff'
        });
      }
    });
  } catch (e) {
    console.error(e);
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải danh sách thôn</div>`;
  }
}

document.addEventListener('DOMContentLoaded', renderQrGrid);
