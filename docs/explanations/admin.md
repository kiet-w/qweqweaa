# Giải Thích Chi Tiết - Module Admin (`src/admin`)

`src/admin` là trung tâm điều hành hệ thống (Back-office). Module này cung cấp các API đặc quyền chỉ dành cho Quản trị viên (Admin) để quản lý danh mục (Category), sản phẩm (Product) và đơn hàng (Order).

## 1. Cấu trúc và Bảo mật

Tất cả các endpoint trong module này đều được bảo vệ nghiêm ngặt:

- **`@UseGuards(AuthGuard, RolesGuard)`**: Yêu cầu người dùng phải đăng nhập (`AuthGuard`) và phải có vai trò phù hợp (`RolesGuard`).
- **`@Roles(UserRole.ADMIN)`**: Ràng buộc chỉ những tài khoản có `role: 'ADMIN'` trong cơ sở dữ liệu mới được phép truy cập.

---

## 2. Phân tích chi tiết Controller (`admin.controller.ts`)

Mỗi request gửi đến `/admin` sẽ được điều phối bởi `AdminController`.

### 2.1. Quản lý Danh mục (Categories)

| Endpoint | Method | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/categories` | `POST` | `CreateCategoryDto` | Tạo danh mục mới. Trả về object `Category` vừa tạo. |
| `/admin/categories/:id` | `PATCH` | `id` (path), `UpdateCategoryDto` | Cập nhật thông tin danh mục. Trả về `Category` sau khi sửa. |

### 2.2. Quản lý Sản phẩm (Products)

| Endpoint | Method | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/products` | `POST` | `CreateProductDto` | Tạo sản phẩm kèm theo ảnh. Trả về `Product` kèm `images` và `category`. |
| `/admin/products/:id` | `PATCH` | `id` (path), `UpdateProductDto` | Cập nhật sản phẩm. Nếu có `images`, toàn bộ ảnh cũ sẽ bị thay thế. |
| `/admin/products/:id` | `DELETE` | `id` (path) | **Xóa mềm** sản phẩm bằng cách gán `deletedAt`. |

### 2.3. Quản lý Đơn hàng (Orders)

| Endpoint | Method | Body / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `/admin/orders` | `GET` | `AdminOrderQueryDto` (Query) | Lấy danh sách đơn hàng có phân trang và lọc theo trạng thái. |
| `/admin/orders/:id/status` | `PATCH` | `id` (path), `UpdateOrderStatusDto` | Cập nhật trạng thái đơn hàng (ví dụ: từ `PENDING` sang `SHIPPED`). |

---

## 3. Phân tích chi tiết Service (`admin.service.ts`)

`AdminService` chứa logic nghiệp vụ cốt lõi, tương tác với database qua `PrismaService` và quản lý cache qua `RedisService`.

### 3.1. Các phương thức bổ trợ (Internal Helpers)
- **`ensureCategoryExists(id)`**: Kiểm tra danh mục có tồn tại không. Nếu không, ném lỗi `NotFoundException (404)`.
- **`ensureProductExists(id)`**: Kiểm tra sản phẩm có tồn tại không. Trả về `product` nếu tìm thấy, ngược lại ném lỗi 404.
- **`ensureUniqueCategorySlug(slug, excludeId?)`**: Đảm bảo `slug` danh mục là duy nhất. Nếu trùng, ném lỗi `ConflictException (409)`.
- **`ensureUniqueProductSlug(slug, excludeId?)`**: Tương tự cho sản phẩm, giúp URL SEO không bị trùng lặp.

### 3.2. Xử lý nghiệp vụ chính

#### Tạo & Cập nhật Sản phẩm (`createProduct`, `updateProduct`)
- **Ép kiểu dữ liệu**: `price` từ client gửi lên là chuỗi (string) để tránh sai số dấu phẩy động, service sẽ chuyển thành `Prisma.Decimal` trước khi lưu.
- **Xử lý ảnh (Images)**:
    - Khi **tạo**: Dùng `images: { create: [...] }` để lưu quan hệ 1-nhiều.
    - Khi **cập nhật**: Service thực hiện chiến thuật "Xóa hết tạo lại" (`deleteMany: {}` sau đó `create: [...]`). Điều này giúp logic đơn giản nhưng yêu cầu client gửi lại toàn bộ danh sách ảnh muốn giữ.
- **Xóa Cache**: Gọi `invalidateProductCache(slug)` để đảm bảo khách hàng thấy dữ liệu mới nhất ngay lập tức.

#### Xóa mềm (`softDeleteProduct`)
Thay vì dùng lệnh `DELETE` trong SQL, hệ thống cập nhật trường `deletedAt`. Điều này giúp bảo toàn tính toàn vẹn dữ liệu cho các báo cáo doanh thu và lịch sử đơn hàng cũ.

#### Quản lý Đơn hàng (`findOrders`)
Sử dụng `Promise.all` để thực hiện đồng thời hai truy vấn:
1. `prisma.order.findMany`: Lấy dữ liệu đơn hàng kèm thông tin User (chỉ lấy id, email, name) và các Item.
2. `prisma.order.count`: Đếm tổng số đơn hàng để phục vụ phân trang.

---

## 4. Chi tiết DTO (`src/admin/dto`)

DTO (Data Transfer Object) đóng vai trò là "người gác cổng" kiểm soát dữ liệu đầu vào.

### 4.1. Product DTOs
- **`CreateProductDto`**: 
    - `@IsString() price`: Nhận giá dưới dạng chuỗi.
    - `@IsInt() stock`: Số lượng tồn kho (phải >= 0).
    - `@IsEnum(ProductStatus)`: Trạng thái (ACTIVE, INACTIVE).
    - `@ValidateNested()`: Kiểm tra tính hợp lệ của từng object ảnh trong mảng `images`.
- **`UpdateProductDto`**: Giống `CreateProductDto` nhưng tất cả các trường đều là `@IsOptional()`.

### 4.2. Order DTOs
- **`AdminOrderQueryDto`**: Kế thừa từ `PaginationQueryDto`, bổ sung thêm lọc theo `status` (Enum `OrderStatus`).
- **`AdminOrderResponseDto`**: 
    - Chuyển đổi dữ liệu thô từ Prisma sang định dạng JSON sạch.
    - **Quan trọng**: Chuyển tất cả các trường `Decimal` (price, subtotal, total) thành `string` để frontend hiển thị chính xác.
    - Ánh xạ thông tin khách hàng và danh sách sản phẩm trong đơn.

---

## 5. Luồng dữ liệu và Xử lý lỗi

1. **Request**: Admin gửi request kèm JWT Token.
2. **Guard**: Kiểm tra token và quyền `ADMIN`.
3. **Validation**: DTO kiểm tra định dạng dữ liệu (ví dụ: `price` phải là chuỗi, `stock` phải là số).
4. **Service Logic**:
    - Kiểm tra logic: Slug có trùng không? Danh mục có tồn tại không?
    - Nếu sai: Ném lỗi (404, 409). NestJS tự động chuyển thành response JSON tương ứng.
5. **Database**: Thực thi truy vấn qua Prisma.
6. **Cache Invalidation**:
    - Nếu là danh mục: Xóa toàn bộ cache danh mục và reset cache chung.
    - Nếu là sản phẩm: Xóa cache chi tiết của sản phẩm đó dựa trên `slug`.
7. **Response**: Dữ liệu được chuẩn hóa qua `AdminOrderResponseDto` (nếu là đơn hàng) và bọc trong hàm `success()` để trả về client.

## 6. Ghi nhật ký (Logging)

Service sử dụng `Logger` của NestJS để ghi lại các hành động quan trọng:
- `Admin 1 created product 10`
- `Admin 1 updated order 5 status PENDING -> SHIPPED`

Điều này cực kỳ quan trọng trong môi trường doanh nghiệp để truy vết (Audit Trail) xem ai đã thay đổi gì trên hệ thống.
