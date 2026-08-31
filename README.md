# Cổng thông tin & Tương tác cử tri – HĐND Xã Đam Rông 1

Website tĩnh (HTML/CSS/JS + **Supabase** làm backend) dành cho Hội đồng Nhân dân xã
Đam Rông 1, phục vụ 2 nhóm người dùng: **Người dân** (không cần đăng nhập) và
**Cán bộ/Admin** (đăng nhập bằng tài khoản Supabase Auth để vào khu vực quản trị).

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
- **`hoat-dong.html`** – Lịch hoạt động HĐND (Kỳ họp, Giám sát, Tiếp xúc cử tri), lọc theo loại.
- **`gioi-thieu.html`** – Giới thiệu chức năng, nhiệm vụ, cơ cấu tổ chức HĐND xã.
- **`lien-he.html`** – Thông tin liên hệ (SĐT `0365 008 008`, email `hdnddamrong1@lamdong.gov.vn`, Facebook chính thức) + lối tắt gửi kiến nghị.
- **`qr-thon.html`** – Sinh mã QR theo từng thôn trong **9 thôn thật**: Trung Tâm, Thanh Bình, Phi Liêng, Dơng Glê, Lăng Tô, Pul, Đạ Sơn, Đạ K'Nàng, Păng Dung (dẫn tới trang gửi kiến nghị có sẵn tham số thôn).

### Khu vực quản trị (bắt buộc đăng nhập bằng Supabase Auth)
- **`login.html`** – Đăng nhập bằng email/mật khẩu thật qua **Supabase Auth** (không còn dùng bảng dữ liệu lộ mật khẩu như trước). Tài khoản admin do quản trị viên tự tạo trong Supabase Dashboard (Authentication → Users), **không cho phép tự đăng ký** (signup đã bị tắt).
- **`dashboard.html`** – Chỉ truy cập được sau khi đăng nhập (tự chuyển về `login.html` nếu chưa có session hợp lệ):
  - **Tổng quan**: số liệu thống kê kiến nghị/văn bản/tin tức, biểu đồ Chart.js theo trạng thái & lĩnh vực.
  - **Kiến nghị cử tri**: danh sách, lọc theo từ khoá/trạng thái, xem chi tiết, cập nhật trạng thái, viết nội dung trả lời, chọn công khai/ẩn, và **xoá vĩnh viễn kiến nghị** (nút "Xoá" trong modal chi tiết, có xác nhận trước khi xoá).
  - **Quản lý văn bản**: thêm - sửa - xoá qua modal; hỗ trợ **tải file PDF/Word/Excel lên Supabase Storage** (hoặc dán URL file có sẵn), giới hạn 10MB — văn bản có file sẽ hiện nút "Xem/Tải văn bản" ở trang công khai `van-ban.html`.
  - **Quản lý Tin tức / Lịch hoạt động**: thêm - sửa - xoá qua modal; Tin tức hỗ trợ **upload ảnh đại diện** (dùng cho slider trang chủ + thẻ tin tức) và **upload nhiều ảnh phụ cùng lúc** (chỉ hiện khi xem chi tiết bài viết), cả hai đều lưu trực tiếp lên Supabase Storage.
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
| Hoạt động HĐND | `hoat-dong.html` | – |
| Văn bản | `van-ban.html` | – |
| Tin tức | `tin-tuc.html` | – |
| Liên hệ | `lien-he.html` | – |
| Gửi kiến nghị | `gui-kien-nghi.html` | `?thon=<tên thôn>` (tự chọn sẵn khi quét QR) |
| Tra cứu kiến nghị | `tra-cuu.html` | `?code=<mã tra cứu>` (tự tra cứu khi mở link) |
| Mã QR theo thôn | `qr-thon.html` | – |
| Đăng nhập quản trị | `login.html` | – |
| Dashboard quản trị | `dashboard.html` | (yêu cầu đăng nhập; tab: Tổng quan / Kiến nghị / Văn bản / Tin tức / Lịch hoạt động) |

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

Tài khoản đăng nhập admin **không còn là 1 bảng dữ liệu** — quản lý hoàn toàn qua
**Supabase Authentication** (Authentication → Users trong Supabase Dashboard).

### Hàm phía server (RPC) chạy trên Supabase
- `generate_ma_tra_cuu()` – sinh mã tra cứu tuần tự dạng `DR1-{năm}-{số thứ tự}`, tránh trùng mã.
- `tra_cuu_kien_nghi(p_ma_tra_cuu)` – tra cứu 1 kiến nghị theo mã mà không cần mở quyền đọc toàn bảng cho khách.

### Row Level Security (RLS) — phân quyền tại database
- **Khách/người dân (`anon`)**: được `INSERT` kiến nghị mới; chỉ `SELECT` được kiến nghị có `cong_khai = true`; `SELECT` tự do các bảng nội dung công khai (`thon`, `van_ban`, `tin_tuc`, `lich_hoat_dong`).
- **Cán bộ đã đăng nhập (`authenticated`)**: có toàn quyền `SELECT/INSERT/UPDATE/DELETE` trên tất cả các bảng.

### Supabase Storage
- Bucket `attachments` (Public) — lưu ảnh đính kèm kiến nghị (`kien-nghi/...`) và ảnh minh hoạ tin tức (`tin-tuc/...`), upload qua hàm `uploadToStorage()` trong `js/common.js`.

## 4. Chưa triển khai / hạn chế hiện tại

- Chưa gửi email/SMS/Zalo thông báo tự động khi có kiến nghị mới hoặc khi được trả lời.
- Chưa phân quyền chi tiết giữa "Quản trị viên" và "Cán bộ" (mọi tài khoản Supabase Auth được tạo hiện có toàn quyền dashboard).
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
