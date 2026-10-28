# Police Exam Portal - Cổng Thi Trực Tuyến Nội Bộ Sở Cảnh Sát

Hệ thống thi và sát hạch trực tuyến dành cho Sở Cảnh sát, lấy cảm hứng cấu trúc từ azota.vn với các quy chế giám sát chống gian lận nghiêm ngặt, chấm bài độc lập và quản lý cấp bậc sĩ quan.

---

## 1. Mục Asset Logo Cảnh Sát (PD Logo)
Theo yêu cầu, thư mục asset để chứa logo PD được bố trí chuyên biệt tại:
- **`src/assets/logo/`**
  - `pd-logo.svg`: Logo vector chuẩn độ nét cao của Sở Cảnh Sát.
  - `pd-logo.png`: Logo định dạng PNG trong suốt.
  - `README.md`: Hướng dẫn chi tiết cách thay thế logo đơn vị.
- **`public/logo.png`** & **`public/logo.svg`**: Logo placeholder được hiển thị tự động trên favicon, header thanh điều hướng và màn hình đăng nhập.

> **Cách thay logo:** Chỉ cần copy file logo của đơn vị và ghi đè vào `src/assets/logo/pd-logo.svg` hoặc `public/logo.png` / `public/logo.svg`. Hệ thống sẽ tự động cập nhật đồng bộ toàn bộ giao diện!

---

## 2. Công nghệ sử dụng (Tech Stack)
- **Frontend**: React 19 + Vite + TypeScript, Tailwind CSS, React Router v7, i18next (Đa ngôn ngữ Tiếng Việt & Tiếng Anh), lucide-react.
- **UI & Theme**: 
  - Phong cách xanh Navy (`#1a3a6b`) kết hợp Vàng ánh kim (`#ffd700`).
  - Dark Mode & Light Mode với **hiệu ứng hình tròn lan tỏa (Circle Reveal)** bắt đầu từ tâm nút chuyển đổi.
  - Hỗ trợ đầy đủ `prefers-reduced-motion` và thiết kế mobile-first.
- **Widget Chat Tư Vấn**:
  - Tích hợp cửa sổ chat mở rộng mượt mà từ nút bong bóng góc phải.
  - Hỗ trợ câu hỏi nhanh thường gặp, hiệu ứng 3 chấm nhấp nháy (typing indicator), kết nối trực ban trực tiếp.
- **Hệ thống Chống Gian Lận (Anti-Cheat Engine)**:
  - Tự động phát hiện chuyển tab (`visibilitychange`), thu nhỏ cửa sổ (`blur`), thoát ứng dụng (`pagehide`).
  - Trên máy tính: Cảnh báo khi rời màn hình (tối đa 3 lần). Quá 3 lần sẽ tự động khóa và nộp bài.
  - Trên điện thoại di động: Rời quá 30 giây liên tục hoặc quá 3 lần sẽ tự động nộp bài.
  - Khóa chuột phải, cấm sao chép (copy), dán (paste) trong phòng thi.
- **Backend & Database**:
  - Vercel Serverless Functions trong thư mục `/api`.
  - Database Supabase PostgreSQL với file migration đầy đủ trong `db/migration.sql`.
  - Auth: Xác thực Callsign + Mật khẩu, JWT Cookie bảo mật HttpOnly + SameSite=Lax.
  - Tích hợp Mock Engine cục bộ giúp trải nghiệm và kiểm thử ngay lập tức mà không cần kết nối Supabase trước.

---

## 3. Các Vai Trò & Tài Khoản Mẫu Trải Nghiệm Nhanh

Hệ thống có sẵn tài khoản mẫu (Mật khẩu mặc định: `123456`):

| Vai trò | Callsign | Mật khẩu | Chức năng chính |
|---|---|---|---|
| **Quản trị viên (ADMIN)** | `admin` | `123456` | Toàn quyền: Thống kê, Tạo tài khoản (mật khẩu tự sinh hiển thị 1 lần), Cấp bậc, Soạn đề thi (Trắc nghiệm, Tự luận, Đúng/Sai), Giao bài, Duyệt chứng chỉ, Nhật ký chống gian lận. |
| **Cán bộ Chấm thi (GRADER)** | `grader01` | `123456` | Hàng chờ chấm thi, Chấm câu tự luận và giải thích, Xem tiêu chí chấm (grader_note), Phê duyệt đơn phúc khảo. Không được chấm bài của chính mình. |
| **Sĩ quan (OFFICER)** | `officer99` | `123456` | Xem bài thi được giao, Làm bài với giám sát chống gian lận, Xem kết quả, Gửi đơn phúc khảo, Đăng ký chứng chỉ, Xem hồ sơ. |

---

## 4. Hướng dẫn Cài đặt & Chạy Local

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Chạy môi trường Development
```bash
npm run dev
```
Truy cập: `http://localhost:5173`

### Bước 3: Build dự án
```bash
npm run build
```

---

## 5. Cấu hình Supabase & Triển khai Vercel

1. **Supabase**:
   - Tạo Project mới trên [Supabase](https://supabase.com).
   - Mở mục **SQL Editor**, dán toàn bộ nội dung trong file `db/migration.sql` và nhấn **Run** để khởi tạo 12 bảng và các chỉ mục.
2. **Biến môi trường**:
   - Copy `.env.example` thành `.env` và điền:
     ```env
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     JWT_SECRET=your-random-jwt-secret-min-32-chars
     ADMIN_CALLSIGN=admin
     ADMIN_INITIAL_PASSWORD=changeme123
     ```
3. **Triển khai lên Vercel**:
   - Đẩy mã nguồn lên GitHub.
   - Import vào Vercel, cấu hình các biến môi trường trên Vercel Dashboard và Deploy.
