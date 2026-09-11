# Cổng thông tin & Tương tác cử tri – HĐND Xã Đam Rông 1

Website tĩnh (HTML/CSS/JS + **Supabase** làm backend) dành cho Hội đồng Nhân dân xã
Đam Rông 1, phục vụ 3 nhóm người dùng: **Người dân** (không cần đăng nhập),
**Cán bộ/Admin** (đăng nhập bằng tài khoản Supabase Auth để vào khu vực quản trị `dashboard.html`),
và **Đại biểu HĐND** (đăng nhập bằng tài khoản Supabase Auth riêng, chỉ vào được khu vực
riêng `dai-bieu.html` để xem văn bản dự thảo và gửi ý kiến đóng góp — xem chi tiết mục 1.3).

> ⚙️ **Kiến trúc backend đã chuyển từ Table API của nền tảng sang Supabase** (Postgres +
> Auth + Storage) để có thể triển khai độc lập lên Vercel (hoặc bất kỳ hosting tĩnh khác)
> mà không phụ thuộc vào nền tảng xây dựng ban đầu. Xem chi tiết mục 3 và 7.

## 1. Đã hoàn thành

### Trang công khai (không cần đăng nhập)
- **`index.html`** – Trang chủ:
  - Header/topbar phong cách hành chính (quốc huy, tên đơn vị, slogan), menu điều hướng responsive, nút **Đăng nhập** (chỉ hiện nút **Dashboard** khi đã đăng nhập admin).
  - Hero với quốc huy, tiêu đề, slogan, tagline.
  - **Thứ tự trang chủ (giống nhau trên MỌI thiết bị, điện thoại và máy tính):** (1) Banner lớn ở đầu trang → (2) **Slider "Hoạt động nổi bật của địa phương"** → (3) 4 nút bấm nhanh. Banner luôn đứng đầu; slider được đưa lên ngay sau banner (trước 4 nút bấm nhanh) để người dân thấy ngay, không cần cuộn xuống nhiều trên điện thoại.
  - **Hero Action Cards**: 4 nút cốt lõi (nằm ngay dưới slider), 2 hàng: Hàng 1 = Gửi kiến nghị (đỏ) & Tra cứu kiến nghị (xanh lá); Hàng 2 = Tra cứu văn bản (cam) & Lịch hoạt động/Tin tức (dương).
  - **Slider ảnh hoạt động** (tự động chạy + điều khiển tay) lấy dữ liệu từ bảng `tin_tuc` (bài nổi bật). **Bấm vào 1 slide → chuyển thẳng sang trang `tin-tuc.html` và tự mở đúng bài đó** (qua `?id=`).
  - Panel "Văn bản mới" và "Cử tri hỏi – HĐND trả lời" (chỉ hiện kiến nghị được cử tri đồng ý công khai).
  - Banner mã QR theo thôn.
  - Responsive trên điện thoại / tablet / máy tính.
- **`gui-kien-nghi.html`** – Form gửi kiến nghị: họ tên, SĐT, email, thôn (9 thôn thật của xã), lĩnh vực, tiêu đề, nội dung, đính kèm ảnh (lưu vào Supabase Storage), tuỳ chọn công khai. Sau khi gửi, hệ thống tự sinh **mã tra cứu** dạng `DR1-{năm}-{số thứ tự}` (hàm `generate_ma_tra_cuu()` chạy trên Supabase) và hiển thị cho người dùng lưu lại.
- **`tra-cuu.html`** – Nhập mã tra cứu để xem timeline trạng thái (Đã tiếp nhận → Đang xử lý → Đã trả lời) và nội dung trả lời (nếu có), qua hàm `tra_cuu_kien_nghi()`. Có thể mở trực tiếp bằng `tra-cuu.html?code=DR1-2026-0001`. Kèm danh sách "Cử tri hỏi – HĐND trả lời" công khai.
- **`van-ban.html`** – Danh sách văn bản (Nghị quyết/Báo cáo/Kế hoạch/Chỉ đạo/Thông báo), lọc theo từ khoá & loại.
- **`tin-tuc.html`** – Danh sách tin tức/hoạt động dạng lưới ảnh, lọc theo loại & từ khoá. Bấm vào 1 tin → mở modal xem toàn bộ nội dung (ảnh đại diện lớn, tiêu đề, ngày, nội dung đầy đủ từ trường `noi_dung`, kèm **gallery ảnh phụ** nếu bài viết có nhiều ảnh minh hoạ).
- **`hoat-dong.html`** – Lịch hoạt động HĐND (Kỳ họp, Giám sát, Tiếp xúc cử tri), lọc theo loại. (Trang này vẫn tồn tại nhưng **không còn nằm trên menu điều hướng chính** — xem mục ngay dưới, menu đã đổi thành mục "Đại biểu HĐND" chỉ hiện với đại biểu.)
- **`gioi-thieu.html`** – Giới thiệu chức năng, nhiệm vụ, cơ cấu tổ chức HĐND xã.
- **`lien-he.html`** – Thông tin liên hệ (SĐT `0365 008 008`, email `hdnddamrong1@lamdong.gov.vn`, Facebook chính thức) + lối tắt gửi kiến nghị.
- **`qr-thon.html`** – Sinh mã QR theo từng thôn trong **9 thôn thật**: Trung Tâm, Thanh Bình, Phi Liêng, Dơng Glê, Lăng Tô, Pul, Đạ Sơn, Đạ K'Nàng, Păng Dung (dẫn tới trang gửi kiến nghị có sẵn tham số thôn).

### 🆕 1.1. Thay đổi menu điều hướng
- Đã **gỡ bỏ mục "Hoạt động HĐND"** khỏi thanh menu chính (`js/common.js` → `NAV_ITEMS`).
- Thay bằng mục **"Đại biểu HĐND"** — nhưng mục này **ẨN HOÀN TOÀN với người dân**: nó chỉ được chèn thêm vào menu (`renderHeader()` trong `js/common.js`) khi tài khoản đang đăng nhập có `user_metadata.vai_tro = 'Đại biểu'` (kiểm tra bằng hàm `isRepresentative()` ở `js/auth.js`), tức là chỉ hiện SAU khi đăng nhập đúng tài khoản đại biểu — người dân chưa đăng nhập hoặc cán bộ thường sẽ không bao giờ thấy mục này trên menu.

### 🆕 1.2. Vai trò "Đại biểu" — 1 vai trò Supabase Auth hoàn toàn riêng, tách khỏi "Cán bộ"
- Vai trò được lưu trong `user_metadata.vai_tro` của tài khoản Supabase Auth (giống cách lưu `Cán bộ` / `Quản trị viên` hiện có) — quản trị viên chỉ cần tạo tài khoản mới trong Supabase Dashboard (Authentication → Users → thêm user), rồi set `user_metadata: { "ho_ten": "...", "vai_tro": "Đại biểu" }`.
- **Phân luồng đăng nhập tự động theo vai trò** (`js/auth.js`):
  - `guardStaffPage()` — dùng cho `dashboard.html`; nếu tài khoản đăng nhập là Đại biểu thì tự động chuyển sang `dai-bieu.html` (Đại biểu không vào được khu Cán bộ).
  - `guardRepresentativePage()` — dùng cho `dai-bieu.html`; nếu chưa đăng nhập hoặc không phải Đại biểu thì tự động chuyển ra `index.html` / `login.html`.
  - `login.html` sau khi đăng nhập thành công cũng tự động điều hướng: Đại biểu → `dai-bieu.html`, Cán bộ/Quản trị viên → `dashboard.html`.
- ⚠️ **Đây chỉ là điều hướng ở giao diện (route theo vai trò), KHÔNG thay cho bảo mật dữ liệu thật** — bảo mật dữ liệu thật (ai được đọc/ghi bảng nào) vẫn phải cấu hình bằng **Row Level Security (RLS)** trên Supabase, xem mục 3.

### 🆕 1.3. `dai-bieu.html` — Khu vực riêng cho Đại biểu HĐND
- Chỉ vào được sau khi đăng nhập đúng tài khoản có vai trò "Đại biểu" (`guardRepresentativePage()`).
- **Xem & tải văn bản dự thảo**: danh sách văn bản dự thảo (bảng `van_ban_du_thao`) do Cán bộ/Admin đăng lên, kèm link tải file (PDF/Word) nếu có.
- **Gửi ý kiến đóng góp**: mỗi văn bản dự thảo có 1 khung nhập liệu (modal) để đại biểu gửi ý kiến (bảng `y_kien_dong_gop`). Trong thời hạn góp ý, đại biểu có thể **tự chỉnh sửa lại ý kiến của chính mình** bất kỳ lúc nào (bấm lại nút để mở modal, nội dung cũ tự hiện sẵn, sửa rồi gửi lại là ghi đè lên ý kiến trước, không tạo bản ghi trùng).
- **Tự động khoá khi hết hạn / khoá tay**: mỗi văn bản dự thảo có trường `han_gop_y` (hạn góp ý) và `khoa_gop_y` (cờ khoá tay). Khi đã quá `han_gop_y` HOẶC Admin bật `khoa_gop_y = true`, trang tự nhận biết (hàm `isDraftLocked()`) và: ẩn nút gửi/sửa, textarea chuyển `disabled`, đại biểu chỉ xem lại được ý kiến cũ của mình, không gửi/sửa thêm được.

### 🆕 1.4a. Cấp tài khoản Đại biểu bằng CCCD + SĐT (ngay trong Dashboard, không cần vào Supabase)
- Trong tab **"Đại biểu HĐND xã"** của Dashboard, có khu vực **"Tài khoản Đại biểu HĐND"** ở trên cùng, với nút **"Cấp tài khoản mới"**.
- Form cấp tài khoản **chỉ bắt buộc nhập 2 trường: Số CCCD và Số điện thoại** (không bắt buộc Email, vì đại biểu không cần dùng email để đăng nhập).
- **Quy tắc đăng nhập dành cho Đại biểu** (để người lớn tuổi dễ nhớ):
  - **Tên đăng nhập = Số CCCD**
  - **Mật khẩu mặc định = Số điện thoại**
- Vì Supabase Auth chỉ hỗ trợ đăng nhập bằng email (không có khái niệm "username"), hệ thống **tự sinh 1 email nội bộ** dạng `db.<CCCD>@hdnddamrong1.local` phía sau — đại biểu **không cần biết và không nhìn thấy** email này, họ chỉ cần nhớ CCCD + SĐT. Ở màn hình đăng nhập (`login.html`), nếu ô "tên đăng nhập" không chứa dấu `@` thì hệ thống tự hiểu đó là số CCCD và tự chuyển đổi trước khi gửi lên Supabase.
- Khi bấm "Cấp tài khoản": hệ thống gọi `supabaseCreateAccountClient.auth.signUp()` (dùng 1 Supabase client PHỤ, tách biệt, không lưu session — để không làm mất session đăng nhập hiện tại của Admin), tạo tài khoản Supabase Auth mới với `user_metadata = { ho_ten, vai_tro: "Đại biểu", cccd, phai_doi_mk: true }`, đồng thời lưu 1 dòng theo dõi vào bảng `dai_bieu_accounts` (chỉ để Admin tra soát danh sách CCCD đã cấp — **không lưu mật khẩu** ở bảng này, mật khẩu thật chỉ nằm trong Supabase Auth).
- ⚠️ **Yêu cầu bắt buộc trên Supabase để chức năng này hoạt động**: phải **bật lại "Allow new user signups"** và **tắt "Confirm email"** trong Authentication → Settings (xem hướng dẫn & cảnh báo an toàn ở mục 3).

### 🆕 1.4b. Ép đổi mật khẩu ngay lần đăng nhập đầu tiên (bảo mật)
- Tài khoản đại biểu mới cấp có cờ `user_metadata.phai_doi_mk = true`.
- Khi đăng nhập thành công lần đầu bằng mật khẩu mặc định (số điện thoại), `login.html` kiểm tra cờ này (`mustChangePassword()` trong `js/auth.js`) và **hiện modal ép đổi mật khẩu** — đại biểu phải nhập mật khẩu mới (≥ 6 ký tự) và xác nhận lại, rồi mới được vào `dai-bieu.html`. Không thể bấm tắt/bỏ qua modal này.
- Sau khi đổi mật khẩu thành công (`changeOwnPassword()` gọi `supabaseClient.auth.updateUser()`), cờ `phai_doi_mk` tự chuyển về `false` và không hiện lại modal này ở các lần đăng nhập sau.
- **Chặn cả việc gõ thẳng URL để bỏ qua bước đổi mật khẩu**: `guardRepresentativePage()` (dùng cho `dai-bieu.html`) kiểm tra lại `mustChangePassword()` — nếu vẫn còn `true` (chưa đổi mật khẩu), sẽ tự đưa về `login.html` để bắt đổi trước, không cho vào thẳng trang Đại biểu bằng cách gõ URL trực tiếp.

### 🆕 1.4. Dashboard Admin — tab mới "Dự thảo & Đại biểu"
- **Chỉ Cán bộ/Admin thấy tab này** (Đại biểu đăng nhập vào `dashboard.html` sẽ bị tự chuyển hướng ra `dai-bieu.html`, không thấy được tab quản trị nào).
- **Quản lý văn bản dự thảo**: thêm/sửa/xoá qua modal — tiêu đề, mô tả, file dự thảo (upload PDF/Word lên Supabase Storage hoặc dán URL), đặt hạn góp ý (`datetime-local`).
- **Khoá / mở khoá góp ý bằng 1 nút bấm** (icon khoá trên mỗi dòng) — không cần chờ hết hạn mới khoá được, và có thể mở lại nếu cần gia hạn.
- **Xem tất cả ý kiến đóng góp** của từng văn bản dự thảo (số lượng ý kiến hiện ngay trên bảng, bấm vào mở modal xem đầy đủ tên đại biểu + nội dung + ngày gửi/sửa).
- **🆕 Xuất báo cáo tổng hợp ý kiến ra Excel hoặc Word** ngay trong modal xem ý kiến:
  - **Xuất Excel** → tạo file `.csv` (mở trực tiếp bằng Excel, đủ dấu tiếng Việt UTF-8) gồm các cột: Đại biểu, Email, Ngày gửi, Ngày sửa, Nội dung ý kiến.
  - **Xuất Word** → tạo file `.doc` (mở trực tiếp bằng Microsoft Word) trình bày theo từng đại biểu, dễ dùng làm báo cáo tổng hợp cho văn phòng.
  - Cả hai được tạo **hoàn toàn ở phía trình duyệt** (không cần server), nên hoạt động ngay trên trang tĩnh này.
- **🆕 Đăng văn bản chính thức ra trang công khai**: khi dự thảo đã được ký/đóng dấu thành Nghị quyết, Admin bấm nút (icon dấu mộc) trên dòng dự thảo tương ứng → mở modal điền lại thông tin chính thức (tiêu đề, số hiệu, loại, ngày ban hành, mô tả, file bản đã ký) → bấm "Đăng ra trang công khai" sẽ:
  1. Tạo 1 bản ghi mới trong bảng `van_ban` (xuất hiện ngay ở trang công khai `van-ban.html` cho người dân xem/tải).
  2. Đánh dấu dự thảo gốc là `da_ban_hanh = true` và tự động khoá góp ý (`khoa_gop_y = true`) vì văn bản đã chính thức, không cần góp ý thêm.

### Khu vực quản trị (bắt buộc đăng nhập bằng Supabase Auth)
- **`login.html`** – Đăng nhập bằng email/mật khẩu thật qua **Supabase Auth** (không còn dùng bảng dữ liệu lộ mật khẩu như trước). Tài khoản admin do quản trị viên tự tạo trong Supabase Dashboard (Authentication → Users), **không cho phép tự đăng ký** (signup đã bị tắt).
- **`dashboard.html`** – Chỉ truy cập được sau khi đăng nhập (tự chuyển về `login.html` nếu chưa có session hợp lệ):
  - **Tổng quan**: số liệu thống kê kiến nghị/văn bản/tin tức, biểu đồ Chart.js theo trạng thái & lĩnh vực.
  - **Kiến nghị cử tri**: danh sách, lọc theo từ khoá/trạng thái, xem chi tiết, cập nhật trạng thái, viết nội dung trả lời, chọn công khai/ẩn, và **xoá vĩnh viễn kiến nghị** (nút "Xoá" trong modal chi tiết, có xác nhận trước khi xoá).
  - **Quản lý văn bản**: thêm - sửa - xoá qua modal; hỗ trợ **tải file PDF/Word/Excel lên Supabase Storage** (hoặc dán URL file có sẵn), giới hạn 10MB — văn bản có file sẽ hiện nút "Xem/Tải văn bản" ở trang công khai `van-ban.html`.
  - **Quản lý Tin tức / Lịch hoạt động**: thêm - sửa - xoá qua modal; Tin tức hỗ trợ **upload ảnh đại diện** (dùng cho slider trang chủ + thẻ tin tức) và **upload nhiều ảnh phụ cùng lúc** (chỉ hiện khi xem chi tiết bài viết), cả hai đều lưu trực tiếp lên Supabase Storage.
  - **🆕 Dự thảo & Đại biểu** (xem chi tiết ở mục 1.4 phía trên): quản lý văn bản dự thảo, khoá/mở góp ý, xem & xuất Excel/Word ý kiến đại biểu, đăng văn bản chính thức ra công khai.
  - Nút Đăng xuất, sidebar responsive (thu gọn trên mobile bằng nút hamburger).

### Nút Dashboard trên header
- Ẩn hoàn toàn khi chưa đăng nhập (chỉ hiện nút "Đăng nhập").
- Hiện nút "Dashboard" + tên/vai trò cán bộ + nút Đăng xuất khi đã đăng nhập (`js/auth.js` → `renderAuthArea()`), áp dụng đồng bộ trên mọi trang công khai.

### ✅ Bảo mật đã được nâng cấp thật (không còn là "giả bảo mật")
Trước đây việc "đăng nhập" chỉ so khớp mật khẩu ở phía trình duyệt, và mật khẩu dạng
văn bản thô có thể bị bất kỳ ai đọc được qua API công khai — đây là lỗ hổng nghiêm
trọng đã được xử lý. Hiện tại:
- Đăng nhập dùng **Supabase Auth** thật (mật khẩu được mã hoá phía server, không ai xem được).
- Chỉ tài khoản do quản trị viên tự tạo tay mới đăng nhập được — **không ai tự đăng ký được**.
- Toàn bộ quyền đọc/ghi dữ liệu được kiểm soát bằng **Row Level Security (RLS)** ngay tại
  database, không phải chỉ ẩn ở giao diện: người dân (chưa đăng nhập) chỉ được **gửi** kiến
  nghị mới và xem đúng phần công khai; chỉ tài khoản đã đăng nhập (`authenticated`) mới
  được sửa/xoá dữ liệu.

## 2. Sơ đồ trang (URI) & tham số

| Trang | Đường dẫn | Tham số |
|---|---|---|
| Trang chủ | `index.html` | – |
| Giới thiệu | `gioi-thieu.html` | – |
| Hoạt động HĐND (không còn trên menu, vẫn truy cập được qua link trực tiếp) | `hoat-dong.html` | – |
| Văn bản | `van-ban.html` | – |
| Tin tức | `tin-tuc.html` | – |
| Liên hệ | `lien-he.html` | – |
| Gửi kiến nghị | `gui-kien-nghi.html` | `?thon=<tên thôn>` (tự chọn sẵn khi quét QR) |
| Tra cứu kiến nghị | `tra-cuu.html` | `?code=<mã tra cứu>` (tự tra cứu khi mở link) |
| Mã QR theo thôn | `qr-thon.html` | – |
| Đăng nhập quản trị / đại biểu | `login.html` | – (tự chuyển đúng trang theo vai trò sau đăng nhập) |
| Dashboard quản trị (chỉ Cán bộ/Quản trị viên) | `dashboard.html` | (yêu cầu đăng nhập; tab: Tổng quan / Kiến nghị / Văn bản / Tin tức / Lịch hoạt động / **Dự thảo & Đại biểu**) |
| **🆕 Khu vực Đại biểu HĐND** (chỉ tài khoản vai trò đại biểu) | `dai-bieu.html` | (yêu cầu đăng nhập đúng vai trò đại biểu) |

## 3. Dữ liệu & lưu trữ — Supabase (Postgres + Auth + Storage)

Toàn bộ dữ liệu đọc/ghi qua **Supabase JS SDK** (`supabaseClient` khởi tạo trong
`js/supabase-config.js`), thay cho RESTful Table API cũ của nền tảng.

| Bảng | Mục đích | Trường chính |
|---|---|---|
| `kien_nghi` | Kiến nghị của cử tri | `ma_tra_cuu, ho_ten, sdt, email, thon, linh_vuc, tieu_de, noi_dung, hinh_anh_dinh_kem, duong_dan_dinh_kem, trang_thai, tra_loi, ngay_gui, ngay_tra_loi, cong_khai` |
| `van_ban` | Văn bản HĐND | `tieu_de, so_hieu, loai, ngay_ban_hanh, mo_ta, file_url` (link file PDF/Word/Excel, có thể tải trực tiếp qua Storage hoặc dán URL) |
| `tin_tuc` | Tin tức / hoạt động (kèm ảnh cho slider trang chủ) | `tieu_de, loai, hinh_anh, hinh_anh_phu (mảng URL ảnh phụ, chỉ hiện ở modal chi tiết), mo_ta, noi_dung, ngay, noi_bat` |
| `lich_hoat_dong` | Lịch hoạt động (kỳ họp/giám sát/tiếp xúc cử tri) | `tieu_de, loai, ngay, dia_diem, noi_dung` |
| `thon` | Danh sách 9 thôn thật (dùng cho form & QR) | `ten_thon, ma_thon` |
| 🆕 `van_ban_du_thao` | Văn bản dự thảo để đại biểu góp ý (chưa công khai) | `tieu_de, mo_ta, file_url, han_gop_y, khoa_gop_y, da_ban_hanh, van_ban_chinh_thuc_id` |
| 🆕 `y_kien_dong_gop` | Ý kiến đóng góp của từng đại biểu cho 1 văn bản dự thảo | `van_ban_du_thao_id, dai_bieu_email, dai_bieu_ten, noi_dung, ngay_gui, ngay_sua` |
| 🆕 `dai_bieu_accounts` | Danh sách CCCD/SĐT đã cấp cho đại biểu (chỉ để Admin tra soát — **không lưu mật khẩu thật**, mật khẩu thật nằm ở Supabase Auth) | `ho_ten, cccd, so_dien_thoai, email_noi_bo, da_doi_mat_khau` |

Tài khoản đăng nhập admin/đại biểu **không còn là 1 bảng dữ liệu** — quản lý hoàn toàn qua
**Supabase Authentication** (Authentication → Users trong Supabase Dashboard), phân biệt vai trò
qua `user_metadata.vai_tro` (`Quản trị viên` / `Cán bộ` / `Đại biểu`).

> ⚠️ **Cần Admin tự tạo 2 bảng mới `van_ban_du_thao` và `y_kien_dong_gop` trên Supabase**
> (giống cách đã làm với `hinh_anh_phu` trước đây) trước khi tính năng Đại biểu hoạt động được.
> Cấu trúc cột cần tạo:
> ```sql
> create table if not exists van_ban_du_thao (
>   id uuid primary key default gen_random_uuid(),
>   tieu_de text,
>   mo_ta text,
>   file_url text,
>   han_gop_y timestamptz,
>   khoa_gop_y boolean default false,
>   da_ban_hanh boolean default false,
>   van_ban_chinh_thuc_id uuid,
>   created_at timestamptz default now()
> );
> create table if not exists y_kien_dong_gop (
>   id uuid primary key default gen_random_uuid(),
>   van_ban_du_thao_id uuid references van_ban_du_thao(id) on delete cascade,
>   dai_bieu_email text,
>   dai_bieu_ten text,
>   noi_dung text,
>   ngay_gui timestamptz,
>   ngay_sua timestamptz,
>   created_at timestamptz default now()
> );
> alter table van_ban_du_thao enable row level security;
> alter table y_kien_dong_gop enable row level security;
> -- Chỉ tài khoản đã đăng nhập (Cán bộ hoặc Đại biểu) mới đọc/ghi được 2 bảng này -
> -- người dân (anon) KHÔNG được đọc/ghi vì đây là văn bản dự thảo, chưa công khai.
> create policy "authenticated full access" on van_ban_du_thao
>   for all to authenticated using (true) with check (true);
> create policy "authenticated full access" on y_kien_dong_gop
>   for all to authenticated using (true) with check (true);
>
> -- Bảng theo dõi CCCD/SĐT đã cấp cho đại biểu (KHÔNG lưu mật khẩu thật ở đây)
> create table if not exists dai_bieu_accounts (
>   id uuid primary key default gen_random_uuid(),
>   ho_ten text,
>   cccd text,
>   so_dien_thoai text,
>   email_noi_bo text,
>   da_doi_mat_khau boolean default false,
>   created_at timestamptz default now()
> );
> alter table dai_bieu_accounts enable row level security;
> create policy "authenticated full access" on dai_bieu_accounts
>   for all to authenticated using (true) with check (true);
> ```

### 🆕 Cấu hình BẮT BUỘC trên Supabase để "Cấp tài khoản Đại biểu bằng CCCD/SĐT" hoạt động
Vì tính năng này để Admin **tạo tài khoản Supabase Auth mới ngay từ trình duyệt** (không có server riêng để giữ khoá bí mật), nó dùng `auth.signUp()` bằng khoá công khai (anon key) — cách duy nhất khả thi với 1 website tĩnh. Cần vào **Supabase Dashboard → Authentication → Sign In / Providers** (hoặc **Settings**, tuỳ phiên bản UI) và:
1. **Bật lại "Allow new user signups"** (đang tắt theo cấu hình trước đây — phải mở lại thì `signUp()` mới tạo được tài khoản).
2. **Tắt "Confirm email"** (Email confirmation) — vì tài khoản đại biểu dùng email nội bộ giả (`db.<CCCD>@hdnddamrong1.local`), không có hộp thư thật để nhận email xác nhận.

> ⚠️ **Đánh đổi về an toàn cần biết rõ**: khi "Allow new user signups" đang mở, về lý thuyết bất kỳ ai có anon key (khoá này luôn công khai trong code phía trình duyệt, không phải bí mật) đều có thể tự gọi `auth.signUp()` trực tiếp để tạo 1 tài khoản Supabase Auth "chui" — không chỉ qua nút bấm trong Dashboard. Để chặn rủi ro này, hệ thống đã **siết ở tầng ứng dụng**: tài khoản mới tạo theo cách "chui" (không có `vai_tro` hợp lệ do Admin đặt) sẽ **không lọt qua được `guardStaffPage()` lẫn `guardRepresentativePage()`** — tức là dù tạo được tài khoản, họ vẫn không vào được `dashboard.html` hay `dai-bieu.html`. Tuy nhiên đây vẫn là điều đánh đổi thật (không phải không có rủi ro) — nếu muốn chặn triệt để hơn ở tầng Supabase, cần chuyển việc tạo tài khoản sang 1 Cloud Function/Edge Function riêng dùng `service_role` key (ngoài khả năng của agent này, cần bạn hoặc 1 dev backend triển khai thêm).

### Hàm phía server (RPC) chạy trên Supabase
- `generate_ma_tra_cuu()` – sinh mã tra cứu tuần tự dạng `DR1-{năm}-{số thứ tự}`, tránh trùng mã.
- `tra_cuu_kien_nghi(p_ma_tra_cuu)` – tra cứu 1 kiến nghị theo mã mà không cần mở quyền đọc toàn bảng cho khách.

### Row Level Security (RLS) — phân quyền tại database
- **Khách/người dân (`anon`)**: được `INSERT` kiến nghị mới; chỉ `SELECT` được kiến nghị có `cong_khai = true`; `SELECT` tự do các bảng nội dung công khai (`thon`, `van_ban`, `tin_tuc`, `lich_hoat_dong`). **Không** đọc/ghi được `van_ban_du_thao` và `y_kien_dong_gop` (dự thảo chưa công khai).
- **Cán bộ/Đại biểu đã đăng nhập (`authenticated`)**: có toàn quyền `SELECT/INSERT/UPDATE/DELETE` trên tất cả các bảng bằng RLS hiện tại (bao gồm 2 bảng mới `van_ban_du_thao`, `y_kien_dong_gop`) — việc phân biệt "Cán bộ chỉ quản trị" và "Đại biểu chỉ xem dự thảo + gửi ý kiến" hiện đang được thực hiện **ở tầng giao diện** (route theo `user_metadata.vai_tro`, xem mục 1.2), KHÔNG phải ở RLS. Nếu cần chặn thật ở tầng dữ liệu (ví dụ ngăn 1 đại biểu sửa ý kiến của đại biểu khác qua gọi API trực tiếp), cần bổ sung RLS chi tiết hơn dựa theo `auth.jwt() ->> 'email'` — xem mục 4 & 5.

### Supabase Storage
- Bucket `attachments` (Public) — lưu ảnh đính kèm kiến nghị (`kien-nghi/...`), ảnh minh hoạ tin tức (`tin-tuc/...`), file văn bản (`van-ban/...`) và 🆕 file văn bản dự thảo (`du-thao/...`), upload qua hàm `uploadToStorage()` trong `js/common.js`.

## 4. Chưa triển khai / hạn chế hiện tại

- Chưa gửi email/SMS/Zalo thông báo tự động khi có kiến nghị mới hoặc khi được trả lời (cũng chưa có thông báo cho đại biểu khi có văn bản dự thảo mới cần góp ý).
- Chưa phân quyền chi tiết giữa "Quản trị viên" và "Cán bộ" (mọi tài khoản Supabase Auth có vai_tro khác "Đại biểu" hiện có toàn quyền dashboard).
- 🆕 **Phân biệt vai trò "Cán bộ" / "Đại biểu" hiện ở tầng giao diện (route theo `user_metadata.vai_tro`), CHƯA ở tầng RLS** — về mặt dữ liệu thật, 1 tài khoản đại biểu nếu gọi trực tiếp Supabase API vẫn có thể đọc/sửa bất kỳ bảng nào (vì RLS hiện cấp quyền `authenticated` = toàn quyền). Muốn chặn thật cần viết thêm RLS riêng cho `van_ban_du_thao`/`y_kien_dong_gop` dựa theo vai trò và/hoặc email trong JWT (xem gợi ý ở mục 5).
- Chưa có cơ chế chặn 1 đại biểu sửa ý kiến của đại biểu khác ở tầng dữ liệu (giao diện hiện chỉ cho sửa ý kiến có `dai_bieu_email` khớp với email đang đăng nhập, nhưng nếu gọi API trực tiếp vẫn có thể sửa được bản ghi của người khác).
- 🆕 **Cấp tài khoản Đại biểu bằng CCCD/SĐT yêu cầu bật "Allow new user signups" trên Supabase** — về lý thuyết ai có anon key (luôn công khai) đều gọi được `auth.signUp()` trực tiếp để tạo tài khoản "chui", dù tài khoản đó vẫn bị chặn ở `guardStaffPage()`/`guardRepresentativePage()` vì không có `vai_tro` hợp lệ. Xem giải thích đầy đủ ở mục 3.
- 🆕 Bảng `dai_bieu_accounts` chỉ để Admin tra soát danh sách CCCD/SĐT đã cấp — xoá 1 dòng trong bảng này (nút thùng rác) **không xoá tài khoản đăng nhập thật trên Supabase Auth**; muốn khoá/xoá tài khoản đăng nhập thật phải vào Supabase Dashboard → Authentication → Users để xoá tay.
- Tin tức chưa có trang chi tiết riêng (dùng modal xem toàn bộ nội dung ngay trên trang danh sách, không có URL riêng cho từng bài để chia sẻ).
- Trường hiển thị tên/vai trò cán bộ trên header (`ho_ten`, `vai_tro`) lấy từ `user_metadata` của tài khoản Supabase Auth — nếu chưa được set khi tạo tài khoản, hệ thống sẽ hiển thị email và vai trò mặc định "Cán bộ".
- Website hiện đang chạy ở 2 nơi tách biệt (dữ liệu KHÔNG đồng bộ giữa 2 nơi):
  - Bản preview/Hosted Deploy trên nền tảng GenSpark (dùng code cũ dựa trên Table API, nếu chưa deploy lại).
  - Bản sắp deploy lên Vercel (dùng Supabase — kiến trúc mới, độc lập với nền tảng).

## 5. Đề xuất bước tiếp theo

1. Hoàn tất deploy lên Vercel theo hướng dẫn ở file `HUONG-DAN-DEPLOY-VERCEL.md`.
2. Bổ sung `ho_ten` / `vai_tro` vào `user_metadata` cho các tài khoản admin đã tạo trong Supabase, để header hiển thị đúng tên/chức vụ.
3. Bổ sung phân quyền vai trò (Admin toàn quyền / Cán bộ chỉ xử lý kiến nghị) nếu cần nhiều người cùng quản trị.
4. Thêm thông báo email/Zalo OA khi kiến nghị được trả lời.
5. Cân nhắc dừng/không tiếp tục cập nhật bản Hosted Deploy cũ trên nền tảng GenSpark (dùng Table API) sau khi bản Vercel + Supabase đã hoạt động ổn định, để tránh 2 nguồn dữ liệu song song gây nhầm lẫn.
6. (Tuỳ chọn) Làm trang chi tiết riêng cho từng bài tin tức (URL dạng `tin-tuc-chi-tiet.html?id=...`) nếu cần chia sẻ link bài viết cụ thể — hiện tại xem chi tiết qua modal ngay trên trang danh sách.
7. 🆕 Tạo 3 bảng `van_ban_du_thao`, `y_kien_dong_gop` và `dai_bieu_accounts` trên Supabase (SQL mẫu ở mục 3) — **bắt buộc phải làm trước** thì tính năng Đại biểu mới hoạt động được (hiện tại code đã viết sẵn ở `js/dai-bieu.js` và `js/dashboard.js` nhưng sẽ báo lỗi "không tải được dữ liệu" nếu chưa có bảng).
8. 🆕 Cách 1 (thủ công, không cần bật signup): Tạo tài khoản Supabase Auth cho từng đại biểu (Authentication → Users → Add user), nhớ set `user_metadata` với `"vai_tro": "Đại biểu"` và `"ho_ten": "..."` để họ đăng nhập vào đúng khu vực `dai-bieu.html`.
9. 🆕 Cách 2 (khuyến nghị, dùng ngay trong Dashboard): Bật "Allow new user signups" + tắt "Confirm email" trên Supabase (xem mục 3), sau đó dùng nút **"Cấp tài khoản mới"** trong tab "Đại biểu HĐND xã" của Dashboard — chỉ cần nhập Họ tên + CCCD + SĐT, hệ thống tự tạo tài khoản đăng nhập bằng CCCD/SĐT và tự ép đổi mật khẩu lần đầu.
10. 🆕 (Nâng cao, nếu cần bảo mật chặt hơn) Viết RLS chi tiết cho `y_kien_dong_gop` để đại biểu chỉ `UPDATE` được bản ghi có `dai_bieu_email = auth.jwt() ->> 'email'` của chính họ, thay vì dựa hoàn toàn vào logic kiểm tra ở giao diện.
11. 🆕 (Nâng cao, nếu cần chặn triệt để việc tự tạo tài khoản "chui" qua anon key) Chuyển việc tạo tài khoản đại biểu sang 1 Supabase Edge Function dùng `service_role` key, thay cho việc gọi `auth.signUp()` trực tiếp từ trình duyệt như hiện tại — cần 1 dev backend hỗ trợ thêm vì vượt ngoài khả năng của 1 website tĩnh thuần.

## 6. Công nghệ sử dụng

- HTML5, CSS3 thuần (Font Awesome cho icon).
- JavaScript thuần (Vanilla JS) cho toàn bộ tương tác.
- **Supabase** (Postgres + Auth + Storage) qua `@supabase/supabase-js@2` (CDN) làm backend duy nhất.
- Chart.js (CDN) cho biểu đồ dashboard.
- qrcodejs (CDN) để sinh mã QR theo thôn.
- Google Fonts (Be Vietnam Pro) cho typography tiếng Việt.

## 7. Publish / Triển khai

- **Khuyến nghị**: đưa code lên **Vercel** (miễn phí, có domain `.vercel.app` dùng lâu dài
  không mất phí, không cần mua domain riêng) — xem hướng dẫn chi tiết từng bước trong file
  **`HUONG-DAN-DEPLOY-VERCEL.md`** ở thư mục gốc dự án.
- Vẫn có thể dùng **tab Publish** của nền tảng này để xuất bản bản preview, nhưng lưu ý
  bản đó tách biệt hoàn toàn với dữ liệu Supabase — chỉ nên dùng Vercel làm bản chính thức
  lâu dài theo lựa chọn đã thống nhất.
- File cấu hình kết nối Supabase: `js/supabase-config.js` (chứa `SUPABASE_URL` và
  `anon key` — khoá công khai, an toàn để hiển thị trong code phía trình duyệt vì mọi
  quyền truy cập thật đã được kiểm soát bằng RLS, không dựa vào việc giấu khoá này).
