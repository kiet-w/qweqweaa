# Giải Thích Chi Tiết - Module User (`src/user`)

Module User chịu trách nhiệm quản lý toàn bộ vòng đời của người dùng trong hệ thống, từ việc tạo mới, truy vấn, cập nhật cho đến xóa bỏ. Đây là module nền tảng, cung cấp dữ liệu định danh cho các module khác như Auth, Orders, và Cart.

## 1. Kiến trúc và Thành phần

Module được cấu trúc theo mô hình 3 lớp tiêu chuẩn của NestJS:
- **`UserController`**: Tiếp nhận các yêu cầu HTTP từ client.
- **`UserService`**: Chứa logic nghiệp vụ xử lý dữ liệu và tương tác với Database thông thông qua Prisma, đồng thời quản lý Cache qua Redis.
- **`UserModule`**: Đóng gói và kết nối các thành phần, cho phép các module khác (như Auth) sử dụng lại `UserService`.

---

## 2. `UserController` (Tầng giao diện HTTP)

Controller định nghĩa các endpoint tại đường dẫn `/users`.

| Phương thức | Endpoint | Tham số | Body (Dữ liệu gửi lên) | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/users` | Không | `Prisma.UserCreateInput` | Tạo một người dùng mới. |
| **GET** | `/users` | Không | Không | Lấy danh sách tất cả người dùng (có sử dụng Cache). |
| **GET** | `/users/:id` | `id` (số nguyên) | Không | Lấy thông tin chi tiết của một người dùng theo ID. |
| **PATCH** | `/users/:id` | `id` (số nguyên) | `Prisma.UserUpdateInput` | Cập nhật thông tin của người dùng hiện có. |
| **DELETE** | `/users/:id` | `id` (số nguyên) | Không | Xóa người dùng khỏi hệ thống. |

- **Validation**: Sử dụng `ParseIntPipe` để đảm bảo tham số `:id` trên URL luôn là một số nguyên hợp lệ trước khi đi vào logic xử lý.

---

## 3. `UserService` (Tầng logic nghiệp vụ)

Service này thực hiện các thao tác trực tiếp với cơ sở dữ liệu và quản lý hiệu năng thông qua Redis.

### Các hàm xử lý chính:

#### `create(data: Prisma.UserCreateInput): Promise<User>`
- **Logic**: Tạo người dùng mới trong DB.
- **Cache**: Gọi `this.redisService.del('all_users')` để xóa danh sách cũ, đảm bảo dữ liệu mới nhất sẽ được cập nhật ở lần truy vấn sau.
- **Trả về**: Đối tượng `User` vừa tạo.

#### `getAllUsers()`
- **Logic**: Sử dụng cơ chế **Get-or-Set** của Redis.
- **Quy trình**: Kiểm tra trong Redis có key `all_users` không. Nếu có, trả về ngay. Nếu không, truy vấn từ Postgres qua Prisma, lưu vào Redis với thời gian sống (TTL) là 30 giây, rồi mới trả về.
- **Tối ưu**: Chỉ lấy các trường cần thiết (`id`, `email`, `name`) để giảm tải cho băng thông và bộ nhớ.

#### `findById(id: number)` & `findByEmail(email: string)`
- **Logic**: Tìm kiếm người dùng duy nhất dựa trên ID hoặc Email.
- **Prisma**: Sử dụng `findUnique` để tối ưu tốc độ truy vấn.
- **Trả về**: `User` nếu tìm thấy, ngược lại trả về `null`.

#### `update(id: number, data: Prisma.UserUpdateInput)`
- **Logic**: Cập nhật dữ liệu người dùng theo ID.
- **Cache**: Xóa key `all_users` trong Redis để tránh dữ liệu cũ bị kẹt trong cache.

#### `delete(id: number)`
- **Logic**: Xóa vĩnh viễn người dùng khỏi cơ sở dữ liệu.
- **Cache**: Tương tự như Update, xóa cache danh sách người dùng.

---

## 4. Luồng dữ liệu (Data Flow)

1. **Request**: Client gửi yêu cầu (ví dụ: `GET /users`).
2. **Controller**: `UserController.findAll()` nhận yêu cầu và gọi `userService.getAllUsers()`.
3. **Cache Check**: `UserService` kiểm tra Redis.
    - *Nếu có cache*: Trả về dữ liệu ngay lập tức (~1-2ms).
    - *Nếu không*: Truy vấn database (~20-50ms) -> Lưu vào Redis -> Trả về kết quả.
4. **Response**: Client nhận được dữ liệu JSON.

---

## 5. Xử lý lỗi (Error Handling)

- **Lỗi định dạng**: Nếu `:id` không phải là số (VD: `/users/abc`), `ParseIntPipe` sẽ ném ra lỗi `400 Bad Request`.
- **Không tìm thấy**: Các hàm `findById` hoặc `findByEmail` sẽ trả về `null`. Tầng Controller hoặc các Service gọi nó (như Auth) sẽ chịu trách nhiệm ném ra lỗi `404 Not Found` hoặc lỗi logic tương ứng.
- **Lỗi hệ thống**: Các lỗi liên quan đến Database (ví dụ trùng Email) sẽ được Prisma ném ra và được xử lý bởi `AllExceptionsFilter` toàn cục của hệ thống (nếu có).

---

## 6. Mối quan hệ giữa các Module

- **UserModule & AuthModule**: Có mối quan hệ **Circular Dependency** (phụ thuộc vòng).
    - `UserModule` cần `AuthModule` (ví dụ để bảo vệ endpoint - tương lai).
    - `AuthModule` cần `UserService` để kiểm tra tài khoản khi đăng nhập.
    - **Giải pháp**: Sử dụng `forwardRef(() => AuthModule)` trong `UserModule` để NestJS có thể khởi tạo cả hai mà không bị lỗi vòng lặp.
- **Prisma & Redis**: Module này phụ thuộc chặt chẽ vào `PrismaModule` để lưu trữ và `RedisModule` để tăng tốc độ truy vấn danh sách.
