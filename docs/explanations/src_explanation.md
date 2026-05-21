# NestJS E-commerce Backend - Cấu Trúc & Luồng Dữ Liệu

Tài liệu này giải thích chi tiết cách hoạt động của mã nguồn trong thư mục `src`, luồng dữ liệu vào/ra và các điểm nổi bật kỹ thuật của dự án.

## 1. Cấu Trúc Tổng Quan (Architecture)

Dự án được xây dựng trên framework **NestJS**, tuân thủ mô hình **Modular Architecture**. Mỗi tính năng lớn (Auth, Cart, Catalog, Orders) được đóng gói trong một Module riêng biệt bao gồm:
- **Controller**: Tiếp nhận Request từ Client, định nghĩa Route và validate dữ liệu đầu vào (DTO).
- **Service**: Chứa logic nghiệp vụ chính (Business Logic), tương tác với Database thông qua Prisma.
- **DTO (Data Transfer Object)**: Quy định cấu trúc dữ liệu gửi lên và phản hồi về.
- **Module**: Gắn kết Controller và Service lại với nhau.

---

## 2. Chi Tiết Các Thành Phần Chính

### 📂 `src/admin` (Quản Trị Hệ Thống)
- **Chức năng**: Cho phép Admin quản lý Danh mục, Sản phẩm và Đơn hàng.
- **Tác động liên folder**:
    - **Auth**: Sử dụng `@Roles(UserRole.ADMIN)` và `RolesGuard` (từ `src/common`) kết hợp với `AuthGuard` để đảm bảo chỉ Admin mới có quyền truy cập.
    - **Catalog & Redis**: Khi Admin cập nhật hoặc xóa sản phẩm, `AdminService` sẽ gọi `RedisService.reset()` hoặc `del()` để **hủy cache** của Catalog, buộc người dùng bên ngoài phải nhận dữ liệu mới nhất.
- **Tương tác Prisma**: Thực hiện các truy vấn phức tạp như `softDelete` (cập nhật `deletedAt`) và `include` để lấy thông tin `user` kèm theo `order items`.

### 📂 `src/auth` (Hệ Thống Xác Thực)
- **Chức năng**: Đăng ký, Đăng nhập, Đăng xuất và Làm mới Token (Refresh Token).
- **Tác động liên folder**:
    - **User**: Phụ thuộc vào `UserService` để tìm kiếm và tạo người dùng. Sử dụng `forwardRef` để giải quyết vòng lặp phụ thuộc giữa `Auth` và `User`.
- **Luồng dữ liệu**:
    1. **Login**: Client gửi `email`, `password`. `AuthService` kiểm tra mật khẩu (bcrypt), tạo cặp **JWT (Access & Refresh Token)**.
    2. **Security**: Access Token được lưu vào Cookie `access_token`, Refresh Token được hash và lưu vào Database.
- **Điểm nổi bật**: Sử dụng **HttpOnly Cookies** để chống tấn công XSS.

### 📂 `src/catalog` (Danh Mục & Sản Phẩm)
- **Chức năng**: Xem danh sách sản phẩm, lọc theo giá, tìm kiếm và xem chi tiết sản phẩm.
- **Tương tác Prisma & Redis**:
    - Sử dụng `getOrSet` từ `RedisService` để bọc các truy vấn Prisma. 
    - Luồng: `Check Cache` -> `If null, Prisma Query` -> `Save Cache` -> `Return`.

### 📂 `src/orders` (Đơn Hàng & Thanh Toán)
- **Chức năng**: Chuyển đổi giỏ hàng thành đơn hàng (Checkout).
- **Tác động liên folder**:
    - **Cart**: Đọc dữ liệu từ giỏ hàng hiện tại của User để tạo đơn.
    - **Prisma Transaction (`$transaction`)**: Đây là phần quan trọng nhất:
        - Đảm bảo tính nguyên tử: Nếu trừ kho lỗi hoặc tạo đơn lỗi, toàn bộ sẽ bị hủy.
        - Trừ kho sản phẩm (`stock`) trực tiếp trong Database để tránh sai lệch.

---

## 3. Tương Tác Giữa Các Folder (Cross-Module Communication)

Sự kết nối giữa các folder trong `@src/**` không chỉ là gọi hàm mà còn là sự phối hợp về trạng thái:

1.  **Hệ thống Guard & Decorator (`src/common`)**: 
    - Các folder như `admin`, `cart`, `orders` đều "cắm" `AuthGuard` vào để bảo vệ tài nguyên.
    - Thông tin người dùng sau khi xác thực sẽ được đính vào `request.user` để các Folder khác sử dụng (VD: lấy `userId` để tìm giỏ hàng).
2.  **Toàn cục hóa Service (`Global Modules`)**:
    - `PrismaModule` và `RedisModule` được đánh dấu là `@Global()`. Điều này cho phép mọi Folder khác (như `user`, `catalog`, `admin`) có thể `Inject` trực tiếp `PrismaService` mà không cần import lại nhiều lần.
3.  **Hủy Cache (Cache Invalidation)**:
    - Đây là sự tương tác "ngầm": Folder `admin` tác động trực tiếp lên Folder `catalog` thông qua việc xóa các Key trong Redis khi có sự thay đổi dữ liệu sản phẩm/danh mục.

---

## 4. Tương Tác Với Prisma & Bảo Toàn Dữ Liệu

Dự án sử dụng Prisma như một Type-safe ORM, tác động vào Database thông qua các cơ chế:

-   **Atomic Operations**: Trong `OrdersService`, việc trừ kho sử dụng `updateMany` với điều kiện `stock: { gte: item.quantity }` để đảm bảo không bao giờ bị âm kho, ngay cả khi có hàng ngàn request cùng lúc.
-   **Schema Relation**: Prisma xử lý các mối quan hệ `1-n` (Category - Product) và `n-n` (thông qua bảng trung gian như `CartItem`, `OrderItem`) một cách mượt mà bằng cách sử dụng `include` và `connect`.
-   **Adapter-pg**: `PrismaService` sử dụng `Pool` từ thư viện `pg` để quản lý kết nối hiệu quả hơn, phù hợp cho môi trường Enterprise.

---

## 5. Luồng Đi Của Một Request (Request Lifecycle)

1. **Client** gửi HTTP Request (VD: `POST /orders/checkout`).
2. **Main.ts**: Đi qua `ValidationPipe` (kiểm tra định dạng dữ liệu DTO).
3. **Guards**: `AuthGuard` kiểm tra JWT trong Cookie để xác định người dùng là ai. `RolesGuard` kiểm tra quyền (Admin/User).
4. **Controller**: Tiếp nhận request, bóc tách dữ liệu từ `body` hoặc `user` object.
5. **Service**: Thực hiện logic nghiệp vụ (tính tiền, trừ kho...).
6. **Prisma**: Ghi dữ liệu vào Database.
7. **Response**: Trả về kết quả JSON theo chuẩn `ApiResponse`.
8. **Exception Filter**: Nếu có lỗi, `AllExceptionsFilter` sẽ bắt lại và trả về lỗi có định dạng thống nhất (Error 400, 401, 500...).

---

## 4. Các Kỹ Thuật Nổi Bật (Code Highlights)

1. **Incremental Processing**: Giống như triết lý của CocoIndex, dự án này quản lý trạng thái dữ liệu (Cart -> Order) một cách tuần tự và có kiểm soát chặt chẽ.
2. **Transactional Integrity**: Sử dụng ACID transaction để bảo vệ dữ liệu tài chính/kho bãi.
3. **Performance Optimization**: Kết hợp giữa SQL (Prisma) và NoSQL (Redis) để đạt tốc độ phản hồi nhanh nhất.
4. **Security Best Practices**: Hash mật khẩu bằng `bcrypt`, bảo mật Token bằng `httpOnly` và `secure` cookies.
5. **Clean Code**: Sử dụng Decorators (`@Roles`, `@GetUser`) giúp code ngắn gọn và dễ đọc.

---
*Tài liệu này được tạo tự động để hỗ trợ việc hiểu và phát triển mã nguồn nhanh chóng.*
