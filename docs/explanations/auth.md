# Giải Thích Chi Tiết - Module Auth (`src/auth`)

Module `auth` chịu trách nhiệm xử lý toàn bộ các nghiệp vụ liên quan đến xác thực (Authentication), cấp phép (Authorization cơ bản), và bảo mật hệ thống. Module này sử dụng **JWT (JSON Web Token)** để quản lý phiên đăng nhập và bảo vệ token bằng cơ chế **HttpOnly Cookies**.

Dưới đây là chi tiết phân tích từng thành phần trong thư mục `src/auth/`.

---

## 1. Controller (`auth.controller.ts`)

Controller này định nghĩa các RESTful API endpoints, là nơi tiếp nhận các yêu cầu (requests) từ client. Controller sử dụng `@UseInterceptors(ClassSerializerInterceptor)` kết hợp với `@SerializeOptions` để tự động lọc bỏ các dữ liệu nhạy cảm (như mật khẩu) trước khi trả về cho client.

### 1.1. Đăng Ký - `POST /auth/register`
- **Chức năng**: Tạo tài khoản người dùng mới.
- **Dữ liệu đầu vào (Body)**: Sử dụng `RegisterDto`.
  - `email` (string): Phải đúng định dạng email, không được để trống.
  - `password` (string): Mật khẩu, ít nhất 6 ký tự.
  - `name` (string): Tên người dùng.
- **Dữ liệu trả về**: Trả về `AuthResponseDto` bao gồm `success: true` và `message: "Đăng ký thành công!"`.

### 1.2. Đăng Nhập - `POST /auth/login`
- **Chức năng**: Xác thực thông tin người dùng và cấp phát Token.
- **Dữ liệu đầu vào (Body)**: Sử dụng `LoginDto`.
  - `email` (string): Bắt buộc, đúng định dạng email.
  - `password` (string): Bắt buộc, ít nhất 6 ký tự.
- **Xử lý đặc biệt**: Sử dụng `@Res({ passthrough: true })` để lấy đối tượng Response của Express nhằm cài đặt Cookie trực tiếp mà không phá vỡ luồng trả về (return) của NestJS.
- **Dữ liệu trả về**: Trả về `AuthResponseDto` bao gồm `success: true`, chuỗi `accessToken`, và thông tin `user` (`UserResponseDto` gồm: `id`, `email`, `name`, `role`). Các trường `password` và `refreshToken` bị loại bỏ (nhờ `@Exclude()` trong DTO).
- **Side Effect**: Thiết lập 2 Cookies (`access_token` và `refresh_token`) vào trình duyệt.

### 1.3. Cấp Lại Token - `POST /auth/refresh`
- **Chức năng**: Tạo mới bộ Access Token và Refresh Token khi Access Token cũ (15 phút) hết hạn.
- **Dữ liệu đầu vào**: Không cần Body. Lấy `refresh_token` từ Cookies của Request (`request.cookies['refresh_token']`).
- **Dữ liệu trả về**: `AuthResponseDto` với `success: true`.
- **Side Effect**: Thay thế (set lại) Cookies `access_token` và `refresh_token` bằng token mới.

### 1.4. Đăng Xuất - `POST /auth/logout`
- **Chức năng**: Xóa phiên đăng nhập.
- **Dữ liệu đầu vào**: Lấy `access_token` từ Cookies để xác định user nào đang yêu cầu đăng xuất.
- **Dữ liệu trả về**: `AuthResponseDto` với `success: true`.
- **Side Effect**: Xóa Cookies `access_token` và `refresh_token` trên trình duyệt (`response.clearCookie`), đồng thời xóa (null) refreshToken của user đó dưới Database.

### 1.5. Lấy Thông Tin Bản Thân - `GET /auth/me`
- **Chức năng**: Lấy thông tin tài khoản đang đăng nhập.
- **Bảo mật**: Endpoints này được bảo vệ bởi `@UseGuards(AuthGuard)`. Người dùng bắt buộc phải có `access_token` hợp lệ trong Cookie.
- **Dữ liệu đầu vào**: Lấy `request.user` (chứa `JwtPayloadDto` do `AuthGuard` gắn vào).
- **Dữ liệu trả về**: `UserResponseDto` (id, email, name, role).

---

## 2. Service (`auth.service.ts`)

Đây là nơi chứa toàn bộ logic xử lý nghiệp vụ (Business Logic). Nó tương tác với `UserService` để lấy dữ liệu từ Database.

### 2.1. Logic Đăng Ký (`register`)
1. **Kiểm tra tồn tại**: Gọi `userService.findByEmail(data.email)`. Nếu đã tồn tại, ném lỗi `ConflictException` (Email đã được sử dụng).
2. **Bảo mật mật khẩu**: Sử dụng `bcrypt.hash(data.password, 10)` để băm (hash) mật khẩu. Mật khẩu thô không bao giờ được lưu vào CSDL.
3. **Lưu CSDL**: Gọi `userService.create` để tạo user với mật khẩu đã băm.

### 2.2. Logic Đăng Nhập (`login`)
1. **Tìm người dùng**: Tìm user qua email bằng `userService.findByEmail`.
2. **Xác thực**: Kiểm tra user có tồn tại và dùng `bcrypt.compare` để so sánh mật khẩu đầu vào với mật khẩu đã băm. Nếu sai, ném `UnauthorizedException` (Email hoặc mật khẩu không đúng).
3. **Tạo Token**: Gọi hàm `generateTokens` để tạo Access Token và Refresh Token.
4. **Lưu Refresh Token**: Gọi `updateRefreshToken` để *băm* Refresh Token và lưu vào CSDL.
5. **Gắn Cookies**: Gọi `setCookies` để đưa token vào Response.

### 2.3. Logic Cấp Lại Token (`handleRefresh`)
1. **Kiểm tra đầu vào**: Nếu không có `refreshToken`, ném `UnauthorizedException`.
2. **Xác minh JWT**: Dùng `jwt.verify` với `JWT_REFRESH_SECRET`. Nếu lỗi hoặc hết hạn (`TokenExpiredError`), ném lỗi `UnauthorizedException`.
3. **Đối chiếu Database**: Tìm user theo `userId` (từ payload). Sau đó tiếp tục dùng `bcrypt.compare` để đối chiếu Refresh Token (do client gửi lên) với Refresh Token (đã băm) lưu trong Database. Nếu không khớp hoặc user đã bị vô hiệu hóa refresh token (bằng null), từ chối ngay lập tức. Tính năng này chặn đứng việc sử dụng lại token đã bị đánh cắp (Token Reuse).
4. **Cấp phát lại**: Tạo token mới, cập nhật hash vào DB, và set Cookies mới.

### 2.4. Logic Đăng Xuất (`handleLogout` & `logout`)
- Dùng `validateAccessToken` để trích xuất `userId` (ngay cả khi Access Token có thể đã hết hạn nhưng ta vẫn lấy được payload nếu format đúng).
- Gọi hàm `logout(userId)` để thực thi lệnh `userService.update(userId, { refreshToken: null })`. Việc set `refreshToken = null` trong DB đồng nghĩa với việc mọi Refresh Token cũ của user này ngay lập tức bị vô hiệu hóa, không thể sinh thêm Access Token mới nữa.
- Gọi `clearCookie` với cùng option cấu hình để trình duyệt xóa cookies.

### 2.5. Cơ Chế Tạo và Gắn Token
- **`generateTokens`**: Sử dụng `jsonwebtoken` sinh 2 token:
  - `accessToken`: Hết hạn trong `15m` (15 phút). Dùng cho các Request thông thường.
  - `refreshToken`: Hết hạn trong `7d` (7 ngày). Chỉ dùng ở endpoint `/refresh`.
- **`setCookies`**: Thiết lập bảo mật cho Cookies:
  - `httpOnly: true`: Hoàn toàn cách ly Cookie khỏi môi trường Javascript (`document.cookie`), phòng chống tối đa tấn công XSS.
  - `secure: isProduction`: Trên môi trường thật (Production), Cookie chỉ được truyền tải qua giao thức HTTPS có mã hóa.
  - `sameSite: 'lax'`: Ngăn chặn tấn công CSRF bằng cách hạn chế gửi Cookie qua các tên miền chéo.

---

## 3. Data Transfer Objects (DTOs)

Nằm trong thư mục `src/auth/dto/`, các class này định nghĩa cấu trúc dữ liệu và các quy tắc kiểm tra (Validation):
- Sử dụng `class-validator` (như `@IsEmail()`, `@IsNotEmpty()`, `@MinLength()`, `@IsInt()`) để kiểm tra dữ liệu đầu vào.
- **Ẩn dữ liệu nhạy cảm**: Trong `UserResponseDto`, các trường `password` và `refreshToken` được đánh dấu `@Exclude()`. Khi dữ liệu đi qua `ClassSerializerInterceptor` ở Controller, các trường này sẽ bị gỡ bỏ trước khi chuyển thành JSON trả về cho frontend.
- **`JwtPayloadDto`**: Định nghĩa chuẩn cấu trúc giấu trong Token gồm: `userId`, `email`, và `role`.

---

## 4. Bảo Vệ Tuyến Phố (Guard) - `auth.guard.ts`

`AuthGuard` đóng vai trò người gác cổng cho các API cần đăng nhập (ví dụ: `GET /auth/me`).
- **Luồng hoạt động**:
  1. Can thiệp vào request chuẩn bị vào Controller thông qua `ExecutionContext`.
  2. Rút trích thẻ: `request.cookies['access_token']`. Nếu không có, ném lỗi 401 (Bạn cần đăng nhập).
  3. Xác thực thẻ: Gọi `authService.validateAccessToken()`. Quá trình này dùng secret key giải mã. Nếu token giả mạo, sai chữ ký, hoặc đã hết thời gian 15 phút, sẽ ném lỗi 401.
  4. Pass: Nếu token hoàn toàn hợp lệ, thông tin giải mã (Payload) sẽ được gắn vào `request.user`.
- Nhờ cơ chế này, bất kỳ Controller nào phía sau cũng có thể gọi `@Req() request` để dễ dàng lấy ra thông tin `request.user.userId` hay `request.user.role` mà không phải lặp lại logic giải mã Token.