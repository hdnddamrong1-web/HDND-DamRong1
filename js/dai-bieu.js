/* =========================================================
   Khu vực Đại biểu HĐND (dai-bieu.html)
   - Chỉ tài khoản Supabase Auth có user_metadata.vai_tro = 'Đại biểu' mới vào được
     (chặn bằng guardRepresentativePage() ở js/auth.js).
   - Đại biểu: xem/tải văn bản dự thảo (bảng van_ban_du_thao), gửi/sửa ý kiến đóng góp
     của CHÍNH MÌNH (bảng y_kien_dong_gop) trong thời hạn góp ý (han_gop_y) và khi
     chưa bị quản trị viên khoá thủ công (khoa_gop_y).
   - Khi hết hạn hoặc đã khoá: chỉ xem lại ý kiến cũ, không sửa/gửi thêm được.
========================================================= */

let allDrafts = [];
let myEmail = '';
let editingDraftId = null;

function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mi} ${dd}/${mm}/${yyyy}`;
}

/* Văn bản dự thảo bị khoá góp ý khi: quản trị viên khoá tay (khoa_gop_y),
   HOẶC đã quá hạn góp y (han_gop_y đã qua). */
function isDraftLocked(d) {
  if (d.khoa_gop_y) return true;
  if (d.han_gop_y && new Date(d.han_gop_y).getTime() < Date.now()) return true;
  return false;
}

async function loadDrafts() {
  try {
    const [drafts, ykiens] = await Promise.all([
      fetchAll('van_ban_du_thao', { sort: '-created_at' }),
      fetchAll('y_kien_dong_gop')
    ]);
    allDrafts = drafts.map((d) => ({
      ...d,
      myYkien: ykiens.find((y) => y.van_ban_du_thao_id === d.id && y.dai_bieu_email === myEmail) || null
    }));
    renderDraftList(allDrafts);
  } catch (e) {
    console.error(e);
    const errEl = document.getElementById('dt-error');
    errEl.textContent = 'Không tải được văn bản dự thảo. Có thể quản trị viên chưa tạo bảng "van_ban_du_thao" / "y_kien_dong_gop" trên Supabase, hoặc chưa cấp quyền RLS cho tài khoản đại biểu.';
    errEl.classList.add('show');
    document.getElementById('dt-list').innerHTML = '';
  }
}

function renderDraftList(list) {
  const mount = document.getElementById('dt-list');
  if (list.length === 0) {
    mount.innerHTML = `<div class="empty-state"><i class="fa-solid fa-folder-open"></i>Hiện chưa có văn bản dự thảo nào cần góp ý</div>`;
    return;
  }
  mount.innerHTML = list
    .map((d) => {
      const locked = isDraftLocked(d);
      const statusHtml = locked
        ? `<span class="status-pill" style="background:#fde3e3;color:#9c1c1c;"><i class="fa-solid fa-lock"></i> ${d.khoa_gop_y ? 'Đã khoá góp ý' : 'Đã hết hạn góp ý'}</span>`
        : `<span class="status-pill status-done"><i class="fa-solid fa-lock-open"></i> Còn thời hạn góp ý</span>`;
      const hasYkien = !!(d.myYkien && d.myYkien.noi_dung);
      return `
      <div class="doc-card" style="flex-direction:column;">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <h4 style="margin:0;"><i class="fa-solid fa-file-lines" style="color:var(--red-700);margin-right:6px;"></i>${escapeHtml(d.tieu_de)}</h4>
          ${statusHtml}
        </div>
        <div class="meta" style="margin-top:8px;">
          ${d.han_gop_y ? `<span><i class="fa-solid fa-clock"></i> Hạn góp ý: ${formatDateTime(d.han_gop_y)}</span>` : '<span>Chưa đặt hạn góp ý</span>'}
        </div>
        <p class="desc">${escapeHtml(d.mo_ta || '')}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          ${
            d.file_url
              ? `<a href="${escapeHtml(d.file_url)}" target="_blank" rel="noopener" class="btn btn-outline"><i class="fa-solid fa-file-arrow-down"></i> Xem / Tải file dự thảo</a>`
              : ''
          }
          <button type="button" class="btn ${hasYkien ? 'btn-outline' : 'btn-gold'}" onclick="openYkienModal('${d.id}')">
            <i class="fa-solid fa-comment-dots"></i> ${hasYkien ? (locked ? 'Xem ý kiến đã gửi' : 'Xem / Sửa ý kiến') : (locked ? 'Chưa gửi ý kiến (đã hết hạn)' : 'Gửi ý kiến đóng góp')}
          </button>
        </div>
      </div>`;
    })
    .join('');
}

function openYkienModal(draftId) {
  const d = allDrafts.find((x) => x.id === draftId);
  if (!d) return;
  editingDraftId = draftId;
  const locked = isDraftLocked(d);
  document.getElementById('modal-ykien-doc-title').textContent = d.tieu_de;
  const textarea = document.getElementById('ykien-noidung');
  textarea.value = d.myYkien ? d.myYkien.noi_dung || '' : '';
  textarea.disabled = locked;
  const submitBtn = document.getElementById('ykien-submit-btn');
  if (locked) {
    submitBtn.style.display = 'none';
    document.getElementById('modal-ykien-title').innerHTML = '<i class="fa-solid fa-comment-dots"></i> Ý kiến đóng góp (đã khoá - chỉ xem)';
    if (!d.myYkien) textarea.value = '(Đồng chí chưa gửi ý kiến trước khi hết hạn)';
  } else {
    submitBtn.style.display = '';
    document.getElementById('modal-ykien-title').innerHTML = '<i class="fa-solid fa-comment-dots"></i> Chỉnh sửa ý kiến đóng góp';
  }
  document.getElementById('modal-ykien').classList.add('open');
}

async function submitYkien() {
  const d = allDrafts.find((x) => x.id === editingDraftId);
  if (!d) return;
  if (isDraftLocked(d)) {
    alert('Văn bản này đã hết hạn hoặc đã bị khoá góp ý, không thể gửi/sửa ý kiến nữa.');
    return;
  }
  const noidung = document.getElementById('ykien-noidung').value.trim();
  if (!noidung) {
    alert('Vui lòng nhập nội dung ý kiến đóng góp.');
    return;
  }
  const btn = document.getElementById('ykien-submit-btn');
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
  try {
    if (d.myYkien && d.myYkien.id) {
      const { error } = await supabaseClient
        .from('y_kien_dong_gop')
        .update({ noi_dung: noidung, ngay_sua: new Date().toISOString() })
        .eq('id', d.myYkien.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseClient.from('y_kien_dong_gop').insert({
        van_ban_du_thao_id: d.id,
        dai_bieu_email: myEmail,
        dai_bieu_ten: getAdminDisplayName(),
        noi_dung: noidung,
        ngay_gui: new Date().toISOString()
      });
      if (error) throw error;
    }
    document.getElementById('modal-ykien').classList.remove('open');
    await loadDrafts();
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi gửi ý kiến. Vui lòng thử lại hoặc liên hệ quản trị viên.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await guardRepresentativePage();
  if (!ok) return;
  myEmail = (getSession().user.email || '').toLowerCase();
  loadDrafts();

  document.getElementById('ykien-submit-btn').addEventListener('click', submitYkien);
  document.getElementById('ykien-cancel-btn').addEventListener('click', () => {
    document.getElementById('modal-ykien').classList.remove('open');
  });
  const overlay = document.getElementById('modal-ykien');
  const closeBtn = document.getElementById('modal-ykien-close');
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
});
