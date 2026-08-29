/* Logic riêng cho trang chủ: slider hoạt động, văn bản mới, Q&A */

let sliderIndex = 0;
let sliderItems = [];
let sliderTimer = null;

async function loadSlider() {
  const track = document.getElementById('slider-track');
  const dots = document.getElementById('slider-dots');
  if (!track) return;
  try {
    const items = await fetchAll('tin_tuc', { sort: '-ngay' });
    sliderItems = items.filter((i) => i.noi_bat).slice(0, 5);
    if (sliderItems.length === 0) sliderItems = items.slice(0, 5);
    if (sliderItems.length === 0) {
      track.innerHTML = `<div class="slide"><div class="slide-caption"><h3>Chưa có hoạt động nào được đăng</h3></div></div>`;
      return;
    }
    track.innerHTML = sliderItems
      .map(
        (item) => `
      <div class="slide">
        <img src="${escapeHtml(item.hinh_anh || 'images/slide-kyhop-1.jpg')}" alt="${escapeHtml(item.tieu_de)}" loading="lazy">
        <div class="slide-caption">
          <span class="tag">${escapeHtml(item.loai || 'Hoạt động HĐND')}</span>
          <h3>${escapeHtml(item.tieu_de)}</h3>
          <p>${escapeHtml((item.mo_ta || '').toString().slice(0, 160))}</p>
        </div>
      </div>`
      )
      .join('');
    dots.innerHTML = sliderItems
      .map((_, idx) => `<button data-idx="${idx}" class="${idx === 0 ? 'active' : ''}"></button>`)
      .join('');
    dots.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => goToSlide(parseInt(btn.dataset.idx, 10)));
    });
    startAutoSlide();
  } catch (e) {
    console.error(e);
    track.innerHTML = `<div class="slide"><div class="slide-caption"><h3>Không thể tải dữ liệu hoạt động</h3></div></div>`;
  }
}

function goToSlide(idx) {
  if (sliderItems.length === 0) return;
  sliderIndex = (idx + sliderItems.length) % sliderItems.length;
  const track = document.getElementById('slider-track');
  track.style.transform = `translateX(-${sliderIndex * 100}%)`;
  document.querySelectorAll('#slider-dots button').forEach((b, i) => {
    b.classList.toggle('active', i === sliderIndex);
  });
}

function startAutoSlide() {
  if (sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(() => goToSlide(sliderIndex + 1), 5000);
}

function bindSliderControls() {
  const prev = document.getElementById('slider-prev');
  const next = document.getElementById('slider-next');
  if (prev) prev.addEventListener('click', () => { goToSlide(sliderIndex - 1); startAutoSlide(); });
  if (next) next.addEventListener('click', () => { goToSlide(sliderIndex + 1); startAutoSlide(); });
}

async function loadHomeDocs() {
  const mount = document.getElementById('home-docs-list');
  if (!mount) return;
  try {
    const docs = await fetchAll('van_ban', { sort: '-ngay_ban_hanh' });
    const top = docs.slice(0, 3);
    if (top.length === 0) {
      mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i>Chưa có văn bản nào</div>`;
      return;
    }
    mount.innerHTML = top
      .map(
        (d) => `
      <a href="van-ban.html" class="list-item">
        <span class="li-icon"><i class="fa-solid fa-file-lines"></i></span>
        <span class="li-txt">
          <h4>${escapeHtml(d.tieu_de)}</h4>
          <span>Ngày ${formatDate(d.ngay_ban_hanh)}</span>
        </span>
        <span class="li-arrow"><i class="fa-solid fa-chevron-right"></i></span>
      </a>`
      )
      .join('');
  } catch (e) {
    console.error(e);
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải văn bản</div>`;
  }
}

async function loadHomeQA() {
  const mount = document.getElementById('home-qa-list');
  if (!mount) return;
  try {
    const list = await fetchAll('kien_nghi', { sort: '-ngay_gui' });
    const top = list.filter((k) => k.cong_khai).slice(0, 3);
    if (top.length === 0) {
      mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-comment-slash"></i>Chưa có câu hỏi công khai</div>`;
      return;
    }
    mount.innerHTML = top
      .map(
        (k) => `
      <a href="tra-cuu.html" class="list-item qa-item">
        <span class="li-icon"><i class="fa-solid fa-circle-question"></i></span>
        <span class="li-txt">
          <h4>${escapeHtml(k.tieu_de)}</h4>
          <span>Ngày ${formatDate(k.ngay_gui)}</span>
          <span class="status-pill ${statusPillClass(k.trang_thai)}">${escapeHtml(k.trang_thai || '')}</span>
        </span>
        <span class="li-arrow"><i class="fa-solid fa-chevron-right"></i></span>
      </a>`
      )
      .join('');
  } catch (e) {
    console.error(e);
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i>Không thể tải dữ liệu</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSlider();
  bindSliderControls();
  loadHomeDocs();
  loadHomeQA();
});
