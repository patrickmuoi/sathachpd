# SPEC: Police Exam Portal

## 1. Mục tiêu
Website thi nội bộ cho một sở cảnh sát. Admin tạo tài khoản và đề thi, giao đề cho sĩ quan. Sĩ quan làm bài online có chống gian lận. Cấp trên chấm phần tự luận. Kết quả trả về ngay trong website. Cấu trúc tham khảo azota.vn (tạo đề, giao bài, thống kê, giám sát gian lận) nhưng chỉ làm đúng những gì ghi trong file này.
KHÔNG làm: ngân hàng câu hỏi, import Word/Excel, camera hay AI giám sát, khóa học (LMS), chấm phiếu OCR, chặn đăng nhập nhiều thiết bị, đính kèm hình ảnh.

## 2. Tech stack (bắt buộc)
- Frontend: React + Vite + TypeScript, Tailwind CSS, React Router, i18next (vi/en), lucide-react.
- Backend: Vercel Serverless Functions trong `/api` (TypeScript). Gom route hợp lý (ví dụ một handler có router nhỏ) để không vượt giới hạn số function của gói miễn phí.
- Database: Supabase Postgres. Chỉ backend truy cập DB bằng service role key; frontend không gọi DB trực tiếp.
- Auth tự làm: callsign + mật khẩu, hash bcrypt, phiên bằng JWT trong cookie httpOnly + Secure + SameSite=Lax.
- Triển khai Vercel. Secret trong biến môi trường, có `.env.example`, không commit secret.
- UI nhẹ: không thư viện UI nặng, không animation nặng, mobile-first.

## 3. Vai trò và quyền
Một tài khoản có thể có nhiều vai trò. Khi đăng nhập người dùng chọn vai trò muốn vào; backend kiểm tra tài khoản thật sự có vai trò đó.
- OFFICER (sĩ quan): xem bài thi được giao, làm bài, xem kết quả, xin phúc khảo, đăng ký chứng chỉ, xem hồ sơ.
- GRADER (người chấm): chỉ cấp bậc có cờ `can_grade` (từ Commander trở lên). Chấm tự luận, duyệt hoặc từ chối phúc khảo.
- ADMIN: toàn quyền (tài khoản, cấp bậc, đề thi, giao bài, duyệt chứng chỉ, xem log và mọi kết quả), kể cả chấm bài.
Mọi kiểm tra quyền làm ở backend. Sĩ quan chỉ đọc được dữ liệu của chính mình.

## 4. Cấp bậc
- Bảng `ranks` (name, level, can_grade) do admin chỉnh được. Seed: Officer (1), Senior Officer (2), Corporal (3), Sergeant (4), Commander (10, can_grade = true). Admin thêm được cấp ở giữa. Quyền chấm dựa vào `can_grade`, không hard-code tên cấp.
- Thi thăng cấp có 3 bậc: Officer → Senior Officer, Senior Officer → Corporal, Corporal → Sergeant.
- Hệ thống KHÔNG tự đổi cấp bậc. Sau khi chấm chỉ hiện Đạt / Không đạt; admin tự cập nhật cấp bậc (có nút tiện lợi trong dashboard).
- Điều kiện đủ thời gian trực do admin tự kiểm tra rồi mới giao bài. Hồ sơ chỉ có trường ghi chú tự do `duty_note` do admin nhập.

## 5. Mô hình dữ liệu (gợi ý, được tinh chỉnh)
- users: id, callsign (unique, lowercase), full_name, password_hash, rank_id, roles (mảng), is_active, duty_note, created_at
- ranks: id, name, level, can_grade
- exams: id, title, type (promotion | certificate | general), target_rank_id, certificate_id, duration_minutes, pass_score (mặc định 5), status (draft | published), created_by, created_at
- questions: id, exam_id, order_index, type (mcq | essay | true_false_explain), text, points, options (jsonb [{id, text}]), correct_option_id (mcq), correct_boolean (true_false_explain), grader_note (đáp án mẫu hoặc tiêu chí chấm, chỉ admin và grader thấy), min_words (mặc định 20)
- certificates: id, name, description, is_active
- certificate_requests: id, user_id, certificate_id, status (pending | approved | rejected), note, decided_by, decided_at, created_at
- user_certificates: id, user_id, certificate_id, attempt_id, granted_at, granted_by (null nếu tự động), revoked_at
- exam_assignments: id, exam_id, user_id, assigned_by, assigned_at, status (assigned | in_progress | submitted | graded | cancelled)
- attempts: id, assignment_id, user_id, exam_id, exam_code (mã đề riêng, 6 ký tự), question_order (jsonb), option_orders (jsonb theo từng câu), started_at, deadline_at, submitted_at, submit_reason (manual | timeout | cheating_auto_submit), status (in_progress | submitted | graded), auto_score, final_score, passed
- answers: id, attempt_id, question_id, selected_option_id, selected_boolean, text_answer, auto_points, manual_points, grader_comment, graded_by, graded_at
- anti_cheat_events: id, attempt_id, type (leave | return | warning | auto_submit), reason (tab_hidden | window_blur | page_leave), device (desktop | mobile), away_seconds, user_agent, occurred_at
- appeals: id, attempt_id, user_id, reason, status (pending | approved | rejected | regraded), decided_by, decided_note, created_at, decided_at. Giữ lịch sử điểm cũ khi chấm lại.

## 6. Luồng nghiệp vụ
### 6.1 Admin tạo đề
Admin tự viết từng câu ngay trong form tạo đề (không có ngân hàng câu hỏi). Ba loại câu:
- mcq: 2 đến 6 đáp án, đúng 1 đáp án. Tự chấm.
- essay: trả lời tự do, tối thiểu 20 từ (kiểm tra cả frontend và backend). Người chấm chấm tay.
- true_false_explain: sĩ quan chọn Đúng hoặc Sai và viết giải thích (tối thiểu 20 từ). Người chấm chấm tay cả câu, có hiển thị đáp án đúng/sai do admin nhập để đối chiếu.
Mỗi câu có điểm riêng, sắp xếp được, có xem trước và publish. Mặc định tổng điểm đề là 10, cảnh báo nếu khác 10. Đề đã có người làm thì khóa nội dung (chỉ cho nhân bản thành đề mới). Không có hình ảnh.
### 6.2 Giao bài
Admin chọn đề và một hoặc nhiều sĩ quan để tạo assignment. Thi thăng cấp: hiển thị cấp hiện tại và cảnh báo nếu đề không khớp cấp. Bài chứng chỉ: chỉ giao khi yêu cầu chứng chỉ đã được duyệt (admin override được, có xác nhận). Không có lịch thi: sĩ quan bấm Bắt đầu bất cứ lúc nào. Mỗi assignment chỉ làm một lần; thi lại thì admin giao assignment mới.
### 6.3 Sĩ quan làm bài
Bài thi của tôi → Bắt đầu → màn hình quy tắc và xác nhận → tạo attempt. Server sinh `exam_code` riêng, trộn thứ tự câu và đáp án riêng cho attempt rồi lưu DB. API chỉ trả đề đã trộn, TUYỆT ĐỐI không kèm đáp án đúng hay grader_note. Đồng hồ dựa trên `deadline_at` của server. Tự lưu nháp (debounce) để tải lại trang không mất bài. Có lưới số câu, đánh dấu câu cần xem lại, nộp bài có xác nhận, hết giờ tự nộp. Sau khi nộp mcq được tự chấm; còn câu chấm tay thì trạng thái Chờ chấm; đề chỉ có mcq thì có kết quả ngay.
### 6.4 Chấm bài
GRADER hoặc ADMIN vào Hàng đợi chấm, mở bài, xem từng câu cùng câu trả lời và grader_note. Nhập điểm từng câu (0 đến điểm tối đa của câu) và chú thích từng câu, có lưu nháp. Bấm Hoàn tất chấm thì tính `final_score` và `passed` (đạt khi final_score >= pass_score), status thành graded và gửi vào mục Kết quả bài thi của sĩ quan. Không được chấm bài của chính mình.
### 6.5 Kết quả
Mục Kết quả bài thi của sĩ quan: danh sách và chi tiết gồm điểm tổng, Đạt/Không đạt, điểm và chú thích từng câu. Chỉ sau khi graded mới được xem lại đáp án (câu trả lời của mình, đáp án đúng, chú thích).
### 6.6 Phúc khảo
Sĩ quan gửi yêu cầu kèm lý do trên bài đã graded (mỗi bài tối đa một yêu cầu đang chờ). GRADER hoặc ADMIN duyệt hoặc từ chối kèm ghi chú. Nếu duyệt, bài quay lại hàng đợi chấm (ưu tiên người chấm khác lần trước), lưu lịch sử điểm cũ, chấm xong cập nhật kết quả.
### 6.7 Chứng chỉ
Sĩ quan xem danh sách chứng chỉ và gửi đăng ký. Admin duyệt hoặc từ chối trong dashboard, sau khi duyệt thì admin giao đề (6.2). Đạt thì chứng chỉ tự hiện trong Hồ sơ (tên, ngày đạt, điểm), không hết hạn; admin vẫn cấp hoặc thu hồi tay được. Hồ sơ gồm: tên, callsign, cấp bậc, chứng chỉ, lịch sử thi, đổi mật khẩu.

## 7. Chống gian lận (không camera, không chặn đa thiết bị)
Nguyên tắc: web không chặn được thật sự việc chuyển tab hay app, chỉ phát hiện, cảnh báo và tự nộp. Chỉ áp dụng khi attempt đang in_progress.
- Phát hiện: `visibilitychange` (hidden), `window blur`, `pagehide`. Trên mobile, thoát app, khóa màn hình hay chuyển app đều tính là rời trang. Dùng `navigator.sendBeacon` để gửi sự kiện rời đi.
- Desktop: mỗi lần rời tab hoặc cửa sổ là 1 vi phạm. Quay lại thì hiện cảnh báo X/3. Vi phạm lần thứ 3 thì tự nộp (submit_reason = cheating_auto_submit).
- Mobile: được rời tối đa 3 lần; mỗi lần quay lại trong 30 giây thì tính 1 cảnh báo. Rời quá 30 giây liên tục, hoặc đến lần thứ 3, thì tự nộp.
- Hằng số cấu hình tập trung một file: `MAX_VIOLATIONS = 3`, `MOBILE_GRACE_SECONDS = 30`.
- Server quyết định: client gửi sự kiện leave/return lên API, server đếm và quyết định tự nộp, nên tải lại trang không reset bộ đếm. Nếu sĩ quan rời đi rồi không quay lại, server xử lý khi attempt được truy cập lại hoặc khi quá deadline (lazy finalize), tính theo thời gian vắng mặt.
- Mỗi lần cảnh báo hiện modal rõ ràng, song ngữ, nêu số lần đã vi phạm.
- Thêm nhẹ: chặn chuột phải, copy, cut, paste trong vùng làm bài (kể cả dán vào ô tự luận). Không bắt buộc fullscreen. Có cờ cấu hình để tắt.
- Log chi tiết từng bài: admin và grader xem timeline gồm thời điểm bắt đầu, từng lần rời và quay lại, thời gian vắng, thiết bị, user agent, cảnh báo thứ mấy, thời điểm nộp và lý do nộp.

## 8. Giao diện và i18n
- Hai ngôn ngữ Việt và Anh, nút chuyển ở header, lưu lựa chọn, mặc định tiếng Việt. Mọi chuỗi UI qua i18next, không hard-code.
- Chế độ sáng và tối: nút chuyển, mặc định theo hệ thống, lưu lựa chọn.
- Logo sở: `/public/logo.png` (placeholder, tôi sẽ thay sau), hiển thị ở header, trang đăng nhập và favicon.
- Phong cách: xanh navy kết hợp vàng, tối giản, nhẹ, chữ rõ, nút to dễ bấm trên điện thoại. Làm bài thi phải dùng tốt trên mobile.
- Đăng nhập: callsign, mật khẩu, chọn vai trò.
- Officer: Bài thi của tôi, Làm bài, Kết quả bài thi, Chứng chỉ, Hồ sơ.
- Grader: Hàng đợi chấm, Chấm bài, Phúc khảo.
- Admin: Tổng quan, Tài khoản (tạo, khóa, đặt lại mật khẩu, đổi cấp bậc), Cấp bậc, Đề thi, Giao bài, Duyệt chứng chỉ, Kết quả và nhật ký (lọc theo đề, người, trạng thái), Phúc khảo.
- Tạo tài khoản: admin nhập họ tên, callsign, cấp bậc, vai trò; mật khẩu khởi tạo tự sinh và chỉ hiển thị một lần để admin gửi cho sĩ quan. Sĩ quan tự đổi được mật khẩu.

## 9. Bảo mật (bắt buộc)
- Không bao giờ gửi đáp án đúng hay grader_note xuống client khi đang làm bài.
- Kiểm tra quyền ở backend cho mọi endpoint; validate input bằng zod.
- Giới hạn đăng nhập sai (khóa tạm sau 5 lần sai).
- Server là nguồn thời gian, không tin timestamp từ client.
- Không lưu hay log mật khẩu thô. Admin đầu tiên tạo bằng script seed từ biến môi trường `ADMIN_CALLSIGN`, `ADMIN_INITIAL_PASSWORD` (hướng dẫn trong README).

## 10. Quy ước code
TypeScript strict. Thư mục: `/src` (pages, components, features, lib, i18n), `/api`, `/db` (migration SQL). Tên bảng, biến, hàm bằng tiếng Anh; chuỗi giao diện nằm trong file ngôn ngữ. Ít dependency, code ngắn gọn. Có seed dữ liệu demo (vài sĩ quan, mỗi loại đề một đề mẫu). Có README: chạy local, tạo project Supabase, chạy migration, deploy lên Vercel.

Có thêm giời gian thi khi tạo bài 

# TÍCH HỢP GIAO DIỆN CHAT TƯ VẤN VÀO DỰ ÁN WEBSITE

## 1. MÔ TẢ GIAO DIỆN

**Tên thành phần:** Cửa sổ chat tư vấn mở rộng từ nút bong bóng ở góc màn hình.

**Mô tả chức năng:**

Khi người dùng nhấn vào nút bong bóng chat ở góc dưới bên phải website, cửa sổ tư vấn sẽ mở rộng ngay từ vị trí của nút đó bằng hiệu ứng phóng to mượt mà.

Phần đầu cửa sổ chat hiển thị:
- Ảnh đại diện của đội ngũ tư vấn.
- Tiêu đề: "Chúng tôi có thể giúp gì cho bạn?"
- Trạng thái phản hồi: "Thông thường chúng tôi trả lời trong vòng 3 phút".

Khi người dùng chọn một câu hỏi nhanh:
1. Nội dung câu hỏi xuất hiện dưới dạng tin nhắn của người dùng.
2. Hiệu ứng ba dấu chấm nhấp nháy xuất hiện để mô phỏng trạng thái đang trả lời.
3. Hệ thống gửi phản hồi tương ứng dưới dạng tin nhắn.
4. Câu trả lời có thể chứa thẻ hướng dẫn hoặc tài liệu trợ giúp.

Khi người dùng chọn "Trò chuyện với nhân viên tư vấn":
1. Hiển thị thông báo nhân viên tư vấn đã tham gia cuộc trò chuyện.
2. Sau một khoảng thời gian ngắn, nhân viên gửi tin nhắn chào hỏi đầu tiên.

**Hướng dẫn tương tác:** Nhấn vào biểu tượng bong bóng chat ở góc dưới bên phải, sau đó chọn một trong các câu hỏi nhanh để trải nghiệm giao diện.

---

## 2. YÊU CẦU TRƯỚC KHI TRIỂN KHAI

Trước khi sửa đổi mã nguồn, hãy thực hiện các bước sau:

### Bước 1: Phân tích công nghệ hiện tại

Xác định chính xác:
- Framework của dự án: React, Next.js, Vue, Svelte, HTML/CSS/JavaScript thuần hoặc công nghệ khác.
- Phương pháp quản lý CSS: CSS Modules, Tailwind CSS, CSS toàn cục hoặc phương pháp khác.
- Cơ chế quản lý giao diện sáng và tối: `data-theme`, class `dark`, CSS Variables hoặc cơ chế hiện có của dự án.

Không tự ý thay đổi công nghệ hoặc kiến trúc hiện tại của dự án.

### Bước 2: Xác định vị trí tích hợp

Tìm và kiểm tra:
- File chứa trang hoặc component cần tích hợp.
- Các component giao diện hiện có tại vị trí đó.
- Những nơi đang sử dụng component dự kiến được thay thế.
- Các dữ liệu, props, sự kiện và chức năng liên quan.

Trước khi chỉnh sửa, hãy báo cáo vị trí file và component sẽ được thêm mới hoặc thay thế.

---

## 3. QUY TẮC TÍCH HỢP

### Bước 3: Thêm component

Tạo component chat tư vấn mới tại vị trí phù hợp trong dự án.

Nếu dự án đã có một thành phần tương đương và cần thay thế, hãy thay thế đúng thành phần đó.

Không chỉnh sửa hoặc xóa những thành phần không liên quan.

### Bước 4: Bảo toàn chức năng hiện có

Phải giữ nguyên tất cả những thành phần sau nếu chúng đã tồn tại:
- Dữ liệu hiện có.
- Props và các tham số truyền vào component.
- Event handlers và logic xử lý sự kiện.
- Giá trị biểu mẫu.
- Các thuộc tính hỗ trợ khả năng truy cập như `aria-label`, `aria-expanded` và các thuộc tính ARIA khác.
- Khả năng điều khiển bằng bàn phím.
- Các chức năng hiện có của website.

Không làm hỏng hoặc thay đổi hành vi của những chức năng không liên quan đến giao diện chat.

### Bước 5: Giữ nguyên thiết kế và hiệu ứng

Sử dụng mã nguồn được cung cấp bên dưới làm chuẩn tham chiếu cho:
- Cấu trúc giao diện.
- Kích thước và cách bố trí các thành phần.
- Màu sắc.
- Bo góc.
- Đổ bóng.
- Hiệu ứng chuyển động.
- Thời gian thực hiện animation.
- Đường cong chuyển động.
- Độ trễ giữa các hiệu ứng.
- Hiệu ứng mở và đóng cửa sổ chat.
- Hiệu ứng xuất hiện tin nhắn.
- Hiệu ứng ba dấu chấm đang nhập.
- Hiệu ứng chuyển trạng thái giữa các thành phần.

Chuyển đổi cấu trúc HTML, CSS và JavaScript sang component, trạng thái và cách xử lý sự kiện phù hợp với framework của dự án.

**Không tự ý thiết kế lại giao diện, thay đổi phong cách hoặc suy đoán để tạo ra một thiết kế khác với mã nguồn gốc.**

### Bước 6: Tích hợp hệ thống màu sắc

Các biến màu có tiền tố `--ux-*` phải được liên kết với hệ thống biến màu hoặc theme hiện có của dự án.

Phải hỗ trợ đầy đủ hai chế độ:
- Light Mode: giao diện sáng.
- Dark Mode: giao diện tối.

Giữ nguyên các giá trị màu dành riêng cho từng chế độ theo mã nguồn gốc.

Nếu dự án đã có hệ thống quản lý theme, hãy tận dụng hệ thống đó thay vì tạo một cơ chế quản lý theme độc lập.

Sau khi tích hợp, kiểm tra giao diện trong cả hai chế độ sáng và tối.

### Bước 7: Cô lập CSS

Tất cả CSS dành riêng cho giao diện chat phải được giới hạn trong phạm vi component.

Sử dụng tiền tố class riêng, chẳng hạn như `.u215`, để tránh xung đột với CSS hiện có.

Các yêu cầu bắt buộc:
- Không sửa đổi CSS toàn cục nếu không thực sự cần thiết.
- Không ghi đè kiểu dáng của các component khác.
- Không tạo các quy tắc CSS có phạm vi ảnh hưởng ngoài component chat.
- Không thay đổi JavaScript toàn cục.
- Không làm ảnh hưởng đến các trang khác trong website.

Nếu sử dụng CSS Modules hoặc Tailwind CSS, hãy triển khai theo phương pháp tương ứng nhưng vẫn phải bảo đảm tính cô lập của giao diện.

### Bước 8: Thay thế dữ liệu mẫu

Thay thế các nội dung minh họa trong mã nguồn bằng dữ liệu phù hợp với dự án thực tế.

Bao gồm:
- Tên thương hiệu.
- Nội dung lời chào.
- Câu hỏi nhanh.
- Nội dung phản hồi.
- Tên nhân viên tư vấn.
- Tiêu đề và nội dung thẻ trợ giúp.
- Những thông tin khác liên quan đến sản phẩm hoặc dịch vụ của website.

Không giữ lại các nội dung minh họa không phù hợp với dự án.

Không sao chép giao diện thư viện, trang trưng bày component hoặc mã nguồn phục vụ riêng cho mục đích trình diễn.

**Lưu ý về bản quyền:** Giữ nguyên dòng chú thích giấy phép MIT ở đầu file component mới. Không xóa hoặc sửa đổi thông tin bản quyền trong chú thích gốc.

### Bước 9: Hỗ trợ giảm chuyển động

Triển khai đầy đủ cơ chế `prefers-reduced-motion`.

Khi người dùng bật tùy chọn giảm chuyển động của hệ điều hành:
- Các hiệu ứng chuyển tiếp phải được rút ngắn hoặc vô hiệu hóa phù hợp.
- Các animation lặp vô hạn phải được dừng hoặc giới hạn.
- Không được làm mất chức năng mở và đóng cửa sổ chat.
- Tin nhắn và nội dung phản hồi vẫn phải xuất hiện bình thường.
- Trạng thái cuối cùng của giao diện phải được hiển thị chính xác.
- Các thao tác tương tác vẫn phải hoạt động đầy đủ.

Không được để việc giảm chuyển động làm gián đoạn logic hoặc khiến giao diện bị kẹt ở trạng thái trung gian.

---

## 4. YÊU CẦU KIỂM TRA SAU KHI TRIỂN KHAI

Sau khi hoàn thành việc tích hợp, hãy kiểm tra các nội dung sau.

### Kiểm tra chức năng

- Nút bong bóng chat có thể mở và đóng cửa sổ tư vấn.
- Cửa sổ mở rộng từ đúng vị trí của nút chat.
- Hiệu ứng mở và đóng hoạt động chính xác.
- Các câu hỏi nhanh có thể được nhấn.
- Tin nhắn của người dùng được hiển thị đúng.
- Hiệu ứng đang nhập xuất hiện và biến mất đúng thời điểm.
- Câu trả lời tương ứng với từng câu hỏi được hiển thị chính xác.
- Thẻ trợ giúp xuất hiện đúng định dạng.
- Chức năng kết nối nhân viên tư vấn hiển thị đúng thông báo và lời chào.
- Không thể gửi liên tục các câu hỏi trong lúc hệ thống đang xử lý nếu điều đó gây xung đột trạng thái.
- Phím Escape có thể đóng cửa sổ chat khi phù hợp.

### Kiểm tra giao diện

Kiểm tra tối thiểu:
- Light Mode.
- Dark Mode.
- Màn hình máy tính.
- Màn hình có chiều rộng nhỏ như điện thoại.
- Các kích thước cửa sổ chat.
- Các hiệu ứng chuyển động.
- Trạng thái mở và đóng.
- Khả năng truy cập bằng bàn phím.
- Chế độ `prefers-reduced-motion`.

Không được tuyên bố đã kiểm tra một hạng mục nếu thực tế chưa thực hiện kiểm tra.

Nếu phát hiện lỗi, hãy sửa lỗi trước khi hoàn thành và báo cáo lại kết quả.

---

## 5. BÁO CÁO HOÀN THÀNH

Sau khi triển khai, hãy cung cấp báo cáo rõ ràng bao gồm:

### A. Danh sách file đã thay đổi
Liệt kê chính xác:
- File được tạo mới.
- File được chỉnh sửa.
- File được thay thế hoặc loại bỏ, nếu có.

### B. Các thay đổi đã thực hiện
Mô tả những thành phần giao diện đã được thêm vào và cách chúng hoạt động.

### C. Những chức năng đã được kiểm tra
Báo cáo kết quả kiểm tra:
- Light Mode và Dark Mode.
- Giao diện trên thiết bị di động.
- Điều khiển bằng bàn phím.
- Các chức năng chat.
- Hiệu ứng chuyển động.
- Khả năng tương thích với hệ thống hiện có.

### D. Những vấn đề chưa được kiểm tra
Nêu rõ những hạng mục chưa thể kiểm tra, nguyên nhân và những việc cần thực hiện tiếp theo.

Không bịa đặt kết quả kiểm thử hoặc khẳng định tính năng hoạt động nếu chưa xác minh.

---

## 6. THÔNG TIN VỊ TRÍ TÍCH HỢP

**Vị trí cần tích hợp:**
[Điền tên trang, component hoặc khu vực cần thêm giao diện chat]

**Thành phần cần thay thế:**
[Điền đường dẫn file hoặc tên component hiện có. Nếu không có, ghi "Không có"]

Nếu thông tin chưa được cung cấp, hãy chủ động phân tích cấu trúc dự án để xác định vị trí tích hợp phù hợp. Nếu không thể xác định chính xác, hãy hỏi lại trước khi thực hiện những thay đổi có thể ảnh hưởng đến các thành phần hiện có.

---

## 7. MÃ NGUỒN GỐC

Sử dụng toàn bộ mã nguồn HTML, CSS và JavaScript được cung cấp kèm theo prompt này làm cơ sở triển khai.

Mã nguồn gốc bao gồm:
- Các biến màu dành cho Light Mode và Dark Mode.
- CSS của giao diện chat.
- Nút mở và đóng cửa sổ tư vấn.
- Phần đầu cửa sổ chat.
- Khu vực hiển thị tin nhắn.
- Các câu hỏi nhanh.
- Hiệu ứng ba dấu chấm đang nhập.
- Thẻ nội dung trợ giúp.
- Logic xử lý các câu hỏi.
- Logic hiển thị phản hồi.
- Logic mô phỏng nhân viên tư vấn tham gia cuộc trò chuyện.
- Các thuộc tính hỗ trợ khả năng truy cập.
- Cơ chế giảm chuyển động.

**Yêu cầu cuối cùng:** Hãy đọc và phân tích toàn bộ mã nguồn gốc trước khi triển khai. Sau đó tích hợp giao diện vào dự án thực tế, bảo toàn kiến trúc và chức năng hiện có, giữ đúng thiết kế và hiệu ứng, đồng thời bảo đảm component hoạt động ổn định và không gây xung đột với các thành phần khác.

Không chỉ trả về hướng dẫn hoặc đoạn mã minh họa. Nếu có quyền truy cập mã nguồn dự án, hãy trực tiếp thực hiện các thay đổi cần thiết, kiểm tra kết quả và báo cáo những gì đã hoàn thành.

# TÍCH HỢP GIAO DIỆN CHUYỂN ĐỔI SÁNG/TỐI VỚI HIỆU ỨNG HÌNH TRÒN LAN TỎA

## 1. MÔ TẢ GIAO DIỆN

**Tên thành phần:** Chuyển đổi chế độ sáng và tối bằng hiệu ứng hình tròn lan tỏa từ vị trí nút bấm.

**Mô tả hoạt động:**

Khi người dùng nhấn vào biểu tượng mặt trời trên thanh điều hướng của website, một lớp giao diện tối sẽ bắt đầu lan tỏa dưới dạng hình tròn từ chính vị trí nút vừa nhấn, mở rộng dần cho đến khi bao phủ toàn bộ giao diện.

Đồng thời, biểu tượng mặt trời sẽ xoay và chuyển thành biểu tượng mặt trăng.

Khi người dùng nhấn lại nút này, giao diện sáng sẽ xuất hiện bằng hiệu ứng hình tròn lan tỏa từ vị trí nút bấm, thay thế giao diện tối.

Toàn bộ thành phần giao diện phải chuyển đổi màu sắc đồng bộ, bao gồm:
- Màu nền trang web.
- Màu chữ.
- Màu nền thẻ nội dung.
- Màu đường viền.
- Màu biểu đồ và dữ liệu.
- Màu các nút điều khiển.
- Màu các thành phần giao diện khác.

**Yêu cầu tương tác:** Người dùng có thể nhấn vào nút mặt trời hoặc mặt trăng ở góc trên bên phải để chuyển đổi giữa Light Mode và Dark Mode.

---

## 2. KIỂM TRA DỰ ÁN TRƯỚC KHI THỰC HIỆN

Trước khi sửa mã nguồn, hãy thực hiện các bước sau.

### Bước 1: Xác định công nghệ của dự án

Kiểm tra và xác định:
- Framework đang sử dụng: React, Next.js, Vue, Svelte, HTML/CSS/JavaScript thuần hoặc công nghệ khác.
- Phương pháp quản lý CSS: CSS Modules, Tailwind CSS, CSS toàn cục hoặc phương pháp hiện có.
- Cơ chế quản lý giao diện sáng/tối: `data-theme`, class `dark`, CSS Variables hoặc hệ thống theme khác.

Không tự ý thay đổi công nghệ hoặc kiến trúc hiện tại của dự án.

### Bước 2: Xác định vị trí tích hợp

Tìm và kiểm tra:
- File chứa thanh điều hướng hoặc header của website.
- Component chịu trách nhiệm chuyển đổi giao diện sáng/tối hiện có.
- Các file quản lý theme và biến màu.
- Những thành phần đang sử dụng hệ thống màu hiện tại.
- Các nơi sử dụng component dự kiến được thay thế.

Trước khi chỉnh sửa, hãy báo cáo đường dẫn file và component dự kiến được thêm mới hoặc thay thế.

---

## 3. QUY TẮC TÍCH HỢP

### Bước 3: Thêm component mới hoặc thay thế component hiện có

Tích hợp hiệu ứng chuyển đổi giao diện vào đúng vị trí trong dự án.

Nếu website đã có nút chuyển đổi Light Mode / Dark Mode, hãy ưu tiên nâng cấp nút hiện tại thay vì tạo thêm một nút mới.

Nếu cần tạo component mới, hãy đặt component tại vị trí phù hợp với cấu trúc dự án.

Không sửa đổi hoặc xóa các thành phần không liên quan.

### Bước 4: Bảo toàn chức năng hiện có

Giữ nguyên:
- Dữ liệu hiện tại.
- Props và các tham số của component.
- Event handlers.
- Trạng thái và logic của ứng dụng.
- Giá trị biểu mẫu.
- Các thuộc tính hỗ trợ khả năng truy cập.
- Các thuộc tính ARIA.
- Khả năng điều khiển bằng bàn phím.
- Những chức năng khác của website.

Không làm hỏng chức năng hiện có trong quá trình tích hợp hiệu ứng.

### Bước 5: Giữ nguyên thiết kế và hiệu ứng chuyển đổi

Sử dụng mã nguồn gốc được cung cấp làm chuẩn tham chiếu.

Phải giữ đúng:
- Cấu trúc giao diện.
- Kích thước và cách bố trí.
- Màu sắc của Light Mode và Dark Mode.
- Hiệu ứng hình tròn lan tỏa.
- Vị trí bắt đầu của hiệu ứng.
- Thời gian chuyển đổi.
- Đường cong chuyển động.
- Hiệu ứng xoay biểu tượng mặt trời và mặt trăng.
- Hiệu ứng chuyển đổi màu sắc giữa hai giao diện.

Khi người dùng nhấn nút chuyển đổi, tâm của hình tròn phải nằm chính xác tại tâm của nút vừa được nhấn.

Hình tròn phải mở rộng đủ lớn để bao phủ toàn bộ khu vực giao diện cần chuyển đổi.

Khi chuyển đổi ngược lại, hiệu ứng cũng phải bắt đầu từ vị trí nút bấm tương ứng.

Nếu dự án sử dụng React, Next.js, Vue hoặc framework khác, hãy chuyển đổi logic sang component và cơ chế quản lý trạng thái tương ứng.

**Không tự ý thay đổi thiết kế, thay thế hiệu ứng hình tròn bằng hiệu ứng mờ dần hoặc tạo một kiểu chuyển động khác với mã nguồn gốc.**

### Bước 6: Tích hợp hệ thống màu sắc

Các biến màu có tiền tố `--ux-*` cần được liên kết với hệ thống biến màu hoặc theme hiện có của dự án.

Phải duy trì đầy đủ hai bộ màu:

**Light Mode:**
- Nền trang sáng.
- Thẻ nội dung màu trắng hoặc sáng.
- Chữ màu tối.
- Đường viền sáng.
- Màu nhấn phù hợp với giao diện sáng.

**Dark Mode:**
- Nền trang tối.
- Thẻ nội dung có màu tối hơn nền hoặc tương phản phù hợp.
- Chữ màu sáng.
- Đường viền tối.
- Màu nhấn phù hợp với giao diện tối.

Giữ nguyên các giá trị màu được định nghĩa trong mã nguồn gốc.

Nếu dự án đã có hệ thống theme, hãy tận dụng hệ thống đó thay vì tạo một cơ chế quản lý giao diện riêng biệt.

Sau khi tích hợp, kiểm tra để bảo đảm tất cả thành phần sử dụng đúng màu khi chuyển đổi giữa hai chế độ.

### Bước 7: Cô lập CSS

Tất cả CSS của component mới phải được giới hạn trong phạm vi component.

Sử dụng tiền tố class riêng, chẳng hạn như `.u219`, để tránh xung đột với các thành phần khác.

Yêu cầu:
- Không sửa đổi CSS toàn cục nếu không cần thiết.
- Không ghi đè kiểu dáng của các component khác.
- Không tạo quy tắc CSS ảnh hưởng ngoài phạm vi component.
- Không sửa đổi JavaScript toàn cục.
- Không làm thay đổi giao diện của những trang không liên quan.

Nếu sử dụng CSS Modules hoặc Tailwind CSS, hãy triển khai theo phương pháp hiện có của dự án nhưng vẫn phải bảo đảm tính cô lập.

### Bước 8: Thay thế nội dung minh họa

Thay thế các nội dung mẫu trong mã nguồn bằng dữ liệu thực tế của dự án.

Các nội dung cần xem xét:
- Tên thương hiệu.
- Tên các mục trên thanh điều hướng.
- Tiêu đề trang.
- Các chỉ số thống kê.
- Nội dung biểu đồ.
- Dữ liệu minh họa.
- Những thông tin khác đang được hiển thị trong giao diện mẫu.

Không giữ lại dữ liệu minh họa nếu chúng không phù hợp với website thực tế.

Không sao chép các trang trưng bày component hoặc mã nguồn chỉ phục vụ mục đích trình diễn.

**Lưu ý về bản quyền:** Giữ nguyên dòng chú thích giấy phép MIT ở đầu file component mới. Không xóa hoặc thay đổi thông tin bản quyền trong chú thích gốc.

### Bước 9: Hỗ trợ chế độ giảm chuyển động

Triển khai đầy đủ `prefers-reduced-motion`.

Khi người dùng bật chế độ giảm chuyển động của hệ điều hành:
- Vô hiệu hóa hoặc rút ngắn hiệu ứng chuyển tiếp phù hợp.
- Không để hiệu ứng bị kẹt ở trạng thái trung gian.
- Vẫn cho phép chuyển đổi giữa Light Mode và Dark Mode.
- Đảm bảo màu sắc cuối cùng được cập nhật chính xác.
- Đảm bảo biểu tượng mặt trời và mặt trăng hiển thị đúng trạng thái.
- Không làm gián đoạn chức năng của website.

Nếu hiệu ứng hình tròn bị vô hiệu hóa, giao diện vẫn phải chuyển đổi ngay lập tức sang chế độ được chọn.

---

## 4. YÊU CẦU KIỂM TRA SAU KHI TÍCH HỢP

Sau khi hoàn thành, hãy kiểm tra các nội dung sau.

### Kiểm tra chức năng

- Nút chuyển đổi có thể chuyển giữa Light Mode và Dark Mode.
- Hiệu ứng hình tròn bắt đầu từ đúng vị trí nút bấm.
- Hình tròn mở rộng đủ để bao phủ toàn bộ giao diện.
- Biểu tượng mặt trời và mặt trăng chuyển đổi chính xác.
- Màu nền, chữ, thẻ nội dung và biểu đồ được cập nhật đồng bộ.
- Không xảy ra hiện tượng nhấp nháy hoặc hiển thị sai màu.
- Không có hai nút chuyển đổi hoạt động trùng lặp.
- Theme vẫn hoạt động đúng với cơ chế quản lý trạng thái của dự án.
- Không phát sinh lỗi JavaScript trong quá trình chuyển đổi.

### Kiểm tra giao diện

Kiểm tra tối thiểu:
- Light Mode.
- Dark Mode.
- Màn hình máy tính.
- Màn hình điện thoại.
- Các kích thước cửa sổ khác nhau.
- Vị trí nút chuyển đổi.
- Hiệu ứng lan tỏa.
- Khả năng điều khiển bằng bàn phím.
- Chế độ `prefers-reduced-motion`.

Không tuyên bố đã kiểm tra một hạng mục nếu thực tế chưa thực hiện.

Nếu phát hiện lỗi, hãy sửa lỗi trước khi hoàn thành và báo cáo kết quả.

---

## 5. BÁO CÁO HOÀN THÀNH

Sau khi triển khai, hãy cung cấp báo cáo bao gồm:

### A. Danh sách file đã thay đổi
Liệt kê chính xác:
- File được tạo mới.
- File được chỉnh sửa.
- File được thay thế hoặc loại bỏ, nếu có.

### B. Các thay đổi đã thực hiện
Mô tả cách hiệu ứng chuyển đổi hoạt động và những thành phần giao diện đã được cập nhật.

### C. Kết quả kiểm tra
Báo cáo kết quả kiểm tra:
- Light Mode.
- Dark Mode.
- Hiệu ứng hình tròn.
- Biểu tượng chuyển đổi.
- Giao diện trên thiết bị di động.
- Khả năng truy cập bằng bàn phím.
- Chế độ giảm chuyển động.
- Khả năng tương thích với hệ thống theme hiện có.

### D. Những vấn đề chưa được kiểm tra
Liệt kê những hạng mục chưa thể kiểm tra, nguyên nhân và các bước cần thực hiện tiếp theo.

Không bịa đặt kết quả kiểm thử hoặc khẳng định tính năng hoạt động nếu chưa xác minh.

---

## 6. THÔNG TIN VỊ TRÍ TÍCH HỢP

**Vị trí cần tích hợp:**
[Điền tên trang, component hoặc khu vực cần tích hợp hiệu ứng chuyển đổi giao diện]

**Thành phần cần thay thế:**
[Điền đường dẫn file hoặc tên component hiện có. Nếu không có, ghi "Không có"]

Nếu chưa có thông tin, hãy phân tích cấu trúc dự án để xác định vị trí phù hợp.

Nếu không thể xác định chính xác, hãy hỏi lại trước khi thực hiện những thay đổi có thể ảnh hưởng đến các thành phần hiện có.

---

## 7. MÃ NGUỒN GỐC

Sử dụng toàn bộ mã nguồn HTML, CSS và JavaScript được cung cấp kèm theo prompt làm cơ sở triển khai.

Mã nguồn gốc bao gồm:
- Hệ thống biến màu cho Light Mode và Dark Mode.
- Giao diện sáng và tối.
- Nút chuyển đổi mặt trời/mặt trăng.
- Hiệu ứng hình tròn lan tỏa.
- Logic xác định tâm hình tròn dựa trên vị trí nút bấm.
- Logic chuyển đổi trạng thái giao diện.
- Hiệu ứng xoay biểu tượng.
- Các thuộc tính hỗ trợ khả năng truy cập.
- Cơ chế giảm chuyển động.

**Yêu cầu cuối cùng:**

Hãy đọc và phân tích toàn bộ mã nguồn gốc trước khi triển khai.

Sau đó, tích hợp hiệu ứng vào dự án thực tế, bảo toàn kiến trúc và chức năng hiện có, giữ đúng thiết kế và chuyển động, đồng thời bảo đảm component hoạt động ổn định và không gây xung đột với các thành phần khác.

Nếu có quyền truy cập mã nguồn dự án, hãy trực tiếp thực hiện các thay đổi cần thiết, kiểm tra kết quả và báo cáo những gì đã hoàn thành.

Không chỉ trả về hướng dẫn hoặc đoạn mã minh họa.
