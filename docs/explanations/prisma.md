# Giải Thích Chi Tiết - Module Prisma (`src/prisma`)

Prisma đóng vai trò là lớp ORM (Object-Relational Mapping) trung tâm, giúp ứng dụng giao tiếp với cơ sở dữ liệu PostgreSQL một cách an toàn và hiệu quả.

## 1. Kiến Trúc Toàn Cục (`prisma.module.ts`)

Module này được đánh dấu bằng decorator `@Global()`. Điều này có nghĩa là một khi `PrismaModule` được import vào `AppModule`, `PrismaService` sẽ có sẵn ở khắp mọi nơi trong ứng dụng mà không cần phải import lại ở từng module riêng lẻ (User, Product, Order, v.v.).

## 2. Cấu Hình Nâng Cao Của `PrismaService` (`prisma.service.ts`)

Thay vì sử dụng kết nối mặc định của Prisma, dự án này sử dụng cấu trúc **Driver Adapter** để tối ưu hóa hiệu suất:

- **Connection Pooling**: Sử dụng thư viện `pg` (node-postgres) để tạo một `Pool`. Việc này giúp quản lý một tập hợp các kết nối mở sẵn, tránh việc tạo/ngắt kết nối liên tục gây tốn tài nguyên và có thể làm sập Database khi lượng truy cập lớn.
- **Adapter-PG**: Sử dụng `@prisma/adapter-pg` để tích hợp `Pool` của `pg` vào Prisma Client.
- **Kiểm soát lỗi**: Service kiểm tra biến môi trường `DATABASE_URL` ngay trong constructor và ném ra `InternalServerErrorException` nếu thiếu, đảm bảo ứng dụng không chạy trong tình trạng lỗi cấu hình.
- **Khởi tạo kết nối**: Hàm `onModuleInit()` thực hiện `await this.$connect()` ngay khi ứng dụng khởi động, giúp các request đầu tiên không bị trễ do phải đợi thiết lập kết nối.

## 3. Phân Tích Schema (`prisma/schema.prisma`)

Hệ thống cơ sở dữ liệu được thiết kế chặt chẽ với các tính năng:

- **Preview Features**: Bật `driverAdapters` để hỗ trợ kiến trúc Pool nêu trên.
- **Tính Toàn Vẹn Dữ Liệu**:
    - Sử dụng `onDelete: Cascade` cho các quan hệ như `Product` -> `ProductImage`, `Cart` -> `CartItem`, và `Order` -> `OrderItem`. Khi xóa thực thể cha, các dữ liệu liên quan sẽ tự động được dọn dẹp.
    - Đảm bảo tính duy nhất (`@unique`) cho các trường như `email` của User, `slug` của Product và Category.
- **Tối Ưu Truy Vấn**:
    - Đã thiết lập các Composite Index (`@@index`) cho `[userId, status]` trong cả bảng `Cart` và `Order`. Điều này cực kỳ quan trọng để tăng tốc độ truy vấn khi tìm kiếm giỏ hàng đang hoạt động hoặc lịch sử đơn hàng của một người dùng cụ thể.
- **Kiểu Dữ Liệu Chính Xác**: Sử dụng `Decimal(10, 2)` cho các trường tiền tệ (`price`, `total`, `subtotal`) để tránh lỗi làm tròn số thực thường gặp trong tài chính.
