# Hướng dẫn Deploy website lên Vercel (miễn phí, không cần mua domain)

Website này đã được chuyển sang dùng **Supabase** làm backend (database + đăng nhập +
lưu ảnh), nên phần code tĩnh (HTML/CSS/JS) có thể đưa lên **bất kỳ dịch vụ hosting tĩnh
nào**, trong đó **Vercel** là lựa chọn miễn phí, dễ dùng, có sẵn domain
dạng `ten-du-an.vercel.app` (không cần mua domain riêng, dùng lâu dài không mất phí).

## Điều kiện cần trước khi deploy

✅ Bạn đã hoàn tất phần Supabase (database, RLS, Storage, tài khoản đăng nhập) —
nếu chưa chắc, hỏi lại tôi để kiểm tra trước khi deploy.

## Cách 1 — Deploy bằng kéo-thả (không cần biết Git, nhanh nhất)

1. Vào https://vercel.com → **Sign up** (đăng ký miễn phí bằng email hoặc Google).
2. Sau khi đăng nhập vào Dashboard, bấm **Add New... → Project**.
3. Vercel sẽ hỏi "Import Git Repository" — bấm vào tab/liên kết nhỏ ghi
   **"Deploy without Git" / kéo thả file** (hoặc chọn mục **Upload** nếu có).
   - Nếu không thấy tuỳ chọn kéo-thả trực tiếp trên trang chủ, dùng **Cách 2** bên dưới
     (chỉ cần 1 tài khoản GitHub, cũng miễn phí và còn tiện hơn về sau).
4. Tải toàn bộ các file/folder của website này xuống máy bạn (từ khu vực xuất/tải project
   của GenSpark), rồi kéo cả thư mục vào khung upload của Vercel.
5. Bấm **Deploy**. Sau ~30 giây, Vercel trả về 1 link dạng
   `https://ten-du-an.vercel.app` — đây là website đã sống, dùng được ngay, miễn phí lâu dài.

## Cách 2 — Deploy qua GitHub (khuyên dùng, dễ cập nhật sau này)

### Bước 1: Đưa code lên GitHub
1. Tạo tài khoản tại https://github.com (miễn phí).
2. Tạo 1 repository mới (ví dụ tên `hdnd-damrong1`), để **Public** hoặc **Private** đều được.
3. Tải toàn bộ file website hiện tại xuống máy, rồi upload lên repository đó
   (GitHub cho phép kéo-thả file trực tiếp trên web, không cần dùng lệnh `git` nếu không quen).

### Bước 2: Kết nối Vercel với GitHub
1. Vào https://vercel.com → **Sign up with GitHub** (đăng nhập bằng chính tài khoản GitHub
   vừa tạo, để Vercel tự thấy được repository).
2. Bấm **Add New... → Project**.
3. Chọn repository `hdnd-damrong1` vừa tạo → bấm **Import**.
4. Ở bước cấu hình:
   - **Framework Preset**: chọn **Other** (vì đây là site HTML/CSS/JS thuần, không dùng
     framework như React/Next.js).
   - **Build Command**: để trống.
   - **Output Directory**: để trống (hoặc `.`).
5. Bấm **Deploy**.

### Bước 3: Từ nay về sau, mỗi khi bạn (hoặc tôi) sửa code và đẩy lên GitHub,
Vercel sẽ **tự động deploy lại** — không cần làm lại các bước trên.

## Sau khi deploy — kiểm tra lại

Mở link Vercel trả về, thử:
- Trang chủ tải được tin tức/văn bản (nếu database Supabase đã có dữ liệu).
- Gửi 1 kiến nghị thử ở `/gui-kien-nghi.html`.
- Đăng nhập ở `/login.html` bằng tài khoản admin thật của bạn (không phải tài khoản QA test).
- Vào `/dashboard.html` xem các tab.

Nếu trang trắng hoặc lỗi, mở Console trình duyệt (F12 → tab Console) xem thông báo lỗi,
gửi ảnh chụp cho tôi để debug.

## Đặt tên domain riêng (tuỳ chọn, không bắt buộc)

- Nếu chỉ cần dùng lâu dài, miễn phí: giữ nguyên domain `ten-du-an.vercel.app` là đủ,
  không cần mua gì thêm.
- Nếu sau này muốn có domain riêng (ví dụ `hdnddamrong1.vn`), bạn cần **mua domain đó**
  từ nhà cung cấp domain (có phí hàng năm), rồi vào Vercel → Project → **Settings → Domains**
  để gắn domain đó vào — bước này ngoài phạm vi "miễn phí hoàn toàn" ban đầu.

## Lưu ý quan trọng

- **Chìa khoá Supabase** (`anon key`) trong file `js/supabase-config.js` là chìa khoá công
  khai — an toàn để lộ ra trình duyệt, vì mọi quyền truy cập thật đã được kiểm soát bằng
  Row Level Security (RLS) ở phía Supabase, không phải bằng cách "giấu" chìa khoá này.
  Không cần và không nên thêm "biến môi trường" (environment variables) cho việc này trên
  Vercel — cứ để nguyên trong file như hiện tại.
- Tuyệt đối **không** đưa **Service Role Key** của Supabase (khoá quyền cao nhất) vào bất kỳ
  file nào trong website — khoá đó không được dùng trong dự án này và không nên xuất hiện
  ở bất kỳ đâu trong code phía trình duyệt.
