# Lộ Trình Phát Triển Backend (Enterprise Roadmap)

Tài liệu này là "Bản đồ tư duy" giúp bạn biết chính xác mình đang ở đâu và cần học thêm những gì để đưa dự án NestJS hiện tại trở thành một hệ thống **Chuẩn Doanh Nghiệp (Enterprise-grade)** có khả năng phục vụ hàng triệu người dùng.

---

## 📍 Giai đoạn 1: Nền tảng vững chắc (Bạn đang ở đây!)

Chúc mừng bạn! Bạn đã hoàn thành xuất sắc 50% khối lượng công việc cốt lõi của một Backend Developer.

*   ✅ **Framework:** NestJS (Controllers, Services, Modules).
*   ✅ **Database:** PostgreSQL + Prisma ORM (CRUD cơ bản, Nested queries).
*   ✅ **Security:** Xác thực bằng JWT (Json Web Token) + Mã hóa mật khẩu (`bcryptjs`).
*   ✅ **Performance:** Caching dữ liệu với Redis.
*   ✅ **Error Handling:** Bắt lỗi tập trung với Global Exception Filter.

---

## 🚀 Giai đoạn 2: Chuẩn hóa & Phòng thủ (Cần làm tiếp theo)

Trước khi thêm tính năng mới, bạn cần "gia cố" lại hệ thống hiện tại để nó không thể bị phá vỡ bởi các dữ liệu rác hay các cuộc tấn công.

### 1. Data Validation (Kiểm duyệt dữ liệu đầu vào)
*   **Vấn đề:** Hiện tại, nếu người dùng gửi email là `abc` (không phải định dạng email) hoặc mật khẩu chỉ có 1 ký tự, hệ thống vẫn lưu vào DB và gây lỗi sau này.
*   **Công nghệ:** Sử dụng thư viện `class-validator` và `class-transformer` kết hợp với `ValidationPipe` của NestJS.
*   **Mục tiêu:** Hệ thống tự động báo lỗi 400 (Bad Request) nếu dữ liệu gửi lên không đúng chuẩn (VD: Email sai định dạng, password ngắn hơn 8 ký tự).

### 2. Rate Limiting (Chống Spam API)
*   **Vấn đề:** Kẻ xấu dùng tool gọi API Đăng nhập 1000 lần/giây để phá sập Database.
*   **Công nghệ:** `@nestjs/throttler` kết hợp với Redis.
*   **Mục tiêu:** Chặn IP ngay lập tức nếu gọi API quá số lần quy định (VD: Tối đa 10 lần/phút cho API Login).

### 3. Role-Based Access Control - RBAC (Phân quyền)
*   **Vấn đề:** Hiện tại ai có JWT Token cũng là "Vua", có thể vào trang Dashboard.
*   **Công nghệ:** Tạo các Roles Guard (Quản trị viên, Người dùng thường).
*   **Mục tiêu:** Chỉ Admin mới được xem danh sách tất cả Users (`GET /users`), còn User thường chỉ được xem thông tin của chính mình.

---

## 🔥 Giai đoạn 3: Tính Toàn Vẹn & Xử Lý Bất Đồng Bộ

Đây là giai đoạn phân biệt một lập trình viên "Nghiệp dư" và "Chuyên nghiệp".

### 1. Database Transactions (Đảm bảo tính ACID)
*   **Vấn đề:** Khi mua hàng, hệ thống đã trừ tiền nhưng lúc tạo đơn hàng lại bị lỗi mạng -> Khách mất tiền nhưng không có hàng.
*   **Công nghệ:** Prisma `$transaction`.
*   **Mục tiêu:** Đảm bảo "Thành công tất cả" hoặc "Không làm gì cả" (Rollback) khi thực hiện nhiều hành động liên tiếp vào Database.

### 2. Message Queue & Background Jobs (Xử lý ngầm)
*   **Vấn đề:** Tác vụ gửi Email hoặc Upload Video tốn rất nhiều thời gian. Nếu bắt User phải đợi thì trải nghiệm cực kỳ tệ.
*   **Công nghệ:** Redis + BullMQ (`@nestjs/bull`).
*   **Mục tiêu:** Khi có người đăng ký, báo "Thành công" luôn cho khách. Đẩy tác vụ "Gửi email" vào hàng đợi (Queue) để Server từ từ gửi ngầm đằng sau cánh gà.

### 3. Cron Jobs (Lập lịch tự động)
*   **Vấn đề:** Bạn muốn tự động gửi báo cáo doanh thu vào 12h đêm mỗi ngày.
*   **Công nghệ:** `@nestjs/schedule`.
*   **Mục tiêu:** Server tự động chạy các hàm vào các khung giờ cố định mà không cần ai bấm nút.

---

## 📦 Giai đoạn 4: Đóng Gói & DevOps

Làm thế nào để đưa code từ máy tính của bạn lên Internet cho cả thế giới dùng?

### 1. Docker & Docker Compose
*   **Vấn đề:** Code chạy ngon trên máy bạn nhưng đưa lên máy chủ thì lỗi vì thiếu môi trường (chưa cài Node, chưa cài Postgres, phiên bản Redis lệch...).
*   **Công nghệ:** Viết file `Dockerfile` và `docker-compose.yml`.
*   **Mục tiêu:** Bọc toàn bộ code, database, redis vào một "Thùng Container". Mang cái thùng đó đi đâu cũng chạy được chỉ bằng 1 dòng lệnh.

### 2. Cloud Storage (Lưu trữ File)
*   **Vấn đề:** Người dùng upload ảnh Avatar, nếu lưu thẳng vào ổ cứng máy chủ thì máy chủ sẽ rất nhanh đầy dung lượng.
*   **Công nghệ:** AWS S3, Supabase Storage, hoặc MinIO.
*   **Mục tiêu:** Upload file thẳng lên hệ thống lưu trữ đám mây chuyên dụng, Server chỉ lưu lại cái Đường dẫn (URL) của tấm ảnh đó.

---

## 🌐 Giai đoạn 5: Mở Rộng Kiến Trúc (Tương lai xa)

Khi dự án có quá nhiều người dùng và các tính năng Real-time.

### 1. WebSockets (Thời gian thực)
*   **Tính năng:** Làm hệ thống Chat trực tuyến, hoặc Bắn thông báo (Notification) ngay lập tức khi có người thả tim bài viết mà không cần tải lại trang.
*   **Công nghệ:** `@nestjs/websockets`, `Socket.io`.

### 2. Microservices Architecture (Kiến trúc vi dịch vụ)
*   **Vấn đề:** Cả dự án nằm trong 1 cục to tướng (Monolith). Cứ sửa phần User là phần Post lại bị lỗi.
*   **Công nghệ:** Tách dự án ra làm 2 cục riêng biệt (Service User, Service Post) chạy trên các port khác nhau. Cho chúng nói chuyện với nhau qua Redis Pub/Sub, gRPC hoặc RabbitMQ.

---

## 🎯 Tóm lại: Bạn nên làm gì vào ngày mai?
Đừng cố học tất cả cùng một lúc! Hãy đi theo các bước sau:
1. **Ngày mai:** Học cách bắt lỗi dữ liệu đầu vào với `class-validator` (Giai đoạn 2).
2. **Tuần tới:** Học cách dùng Prisma Transaction cho 1 luồng phức tạp (VD: Tạo User kèm theo tạo Profile tự động) (Giai đoạn 3).
3. **Tháng tới:** Viết file Docker để đóng gói sản phẩm lại (Giai đoạn 4).
