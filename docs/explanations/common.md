# Giải Thích Chi Tiết - Module Common (`src/common`)

Khác với các module chứa logic nghiệp vụ cụ thể (như `user`, `cart`, `catalog`), `common` là module chứa các công cụ, tiện ích, cấu hình và các lớp bảo vệ dùng chung cho toàn bộ hệ thống. Mục tiêu của `common` là giảm thiểu code lặp lại (DRY - Don't Repeat Yourself) và chuẩn hóa cấu trúc ứng dụng.

Dưới đây là tài liệu cực kỳ chi tiết về toàn bộ các thành phần trong `src/common`.

---

## 1. Constants (Hằng Số Toàn Cục)
**File:** `src/common/constants/cache.constants.ts`

Chứa các cấu hình mặc định liên quan đến bộ nhớ đệm (Cache/Redis), đảm bảo tính nhất quán trên toàn hệ thống thay vì gõ cứng (hard-code) các chuỗi văn bản và con số.

* **`CACHE_KEYS`**: Đối tượng định nghĩa hoặc tạo ra các chuỗi Key lưu trong Redis.
  * `PRODUCTS`: `'products:list'` (Key cache danh sách sản phẩm chung).
  * `PRODUCT`: Hàm `(slug: string) => "products:${slug}"` (Tạo key động dựa vào slug của sản phẩm).
  * `CATEGORIES`: `'categories:list'` (Key cache danh sách danh mục).
  * `CART`: Hàm `(userId: number) => "cart:${userId}"` (Tạo key động theo ID của user cho giỏ hàng).
* **`CACHE_TTL`**: Đối tượng định nghĩa thời gian sống (Time-To-Live) của cache (đơn vị: milliseconds).
  * `PRODUCTS`: `5 * 60 * 1000` (5 phút).
  * `PRODUCT`: `10 * 60 * 1000` (10 phút).
  * `CATEGORIES`: `60 * 60 * 1000` (1 giờ).
  * `CART`: `10 * 60 * 1000` (10 phút).

---

## 2. Decorators (Thẻ Đánh Dấu Tùy Chỉnh)
**File:** `src/common/decorators/roles.decorator.ts`

NestJS sử dụng Decorator (như `@Get`, `@Post`) để thêm metadata. Ta tạo ra `@Roles()` để gắn nhãn phân quyền cho các endpoint.

* **`ROLES_KEY`**: Hằng số chuỗi `'roles'` được dùng làm chìa khóa (key) lưu metadata.
* **Hàm `Roles(...roles: UserRole[])`**: 
  * **Input**: Một danh sách (mảng các tham số - rest parameters) các quyền (enum `UserRole` từ Prisma, ví dụ `ADMIN`, `USER`).
  * **Output**: Sử dụng `SetMetadata` của NestJS để ghim mảng các roles này vào handler (hàm xử lý API) hoặc class Controller dưới key là `'roles'`.
  * **Sử dụng**: Ví dụ `@Roles(UserRole.ADMIN)` để đánh dấu endpoint này chỉ dành cho Admin.

---

## 3. DTOs (Data Transfer Objects Dùng Chung)
**File:** `src/common/dto/pagination-query.dto.ts`

Class DTO này dùng để chuẩn hóa và xác thực dữ liệu gửi lên qua Query String (`?page=1&limit=10...`) cho các API lấy danh sách.

* **Type `SortQuery`**: Chỉ cho phép 4 giá trị sắp xếp: `'price_asc'`, `'price_desc'`, `'created_asc'`, `'created_desc'`.
* **Class `PaginationQueryDto`**:
  * `page` (Number): Mặc định là 1. Phải là số nguyên dương (`@IsInt()`, `@IsPositive()`).
  * `limit` (Number): Mặc định là 10. Phải là số nguyên dương và tối đa là 100 (`@Max(100)`).
  * `search` (String): Tùy chọn. Sẽ tự động loại bỏ khoảng trắng ở 2 đầu nhờ hàm `@Transform`. Nếu chuỗi rỗng sẽ bị ép về `undefined`.
  * `category` (Number): Tùy chọn. ID của danh mục, phải là số nguyên dương.
  * `minPrice` (String): Tùy chọn, giá tối thiểu. Tự động trim khoảng trắng.
  * `maxPrice` (String): Tùy chọn, giá tối đa. Tự động trim khoảng trắng.
  * `sort` (`SortQuery`): Tùy chọn, mặc định là `'created_desc'` (mới nhất xếp trước). Phải nằm trong tập `IsIn` đã định nghĩa.

---

## 4. Filters (Trạm Xử Lý Lỗi Toàn Cục)
**File:** `src/common/filters/all-exceptions.filter.ts`

Class `AllExceptionsFilter` đóng vai trò "lưới chắn" cuối cùng, hứng tất cả các lỗi (exception) văng ra trong quá trình xử lý request. Ngăn không cho ứng dụng sập và trả lời client một cách lịch sự.

* **Cách hoạt động**:
  1. Kế thừa `ExceptionFilter` và dùng Decorator `@Catch()` không truyền tham số để bắt **MỌI** loại lỗi.
  2. Lấy đối tượng `Request` và `Response` của Express.
  3. **Xác định HTTP Status Code**: Nếu lỗi thuộc về `HttpException` (như 400 Bad Request, 404 Not Found), lấy mã lỗi tương ứng. Nếu lỗi do code sập/lỗi lạ, đặt mã là 500 (`INTERNAL_SERVER_ERROR`).
  4. **Trích xuất thông báo lỗi (`message`)**: Nếu là `HttpException`, lấy chi tiết mảng/chuỗi lỗi gốc. Nếu là lỗi hệ thống thì dùng câu gốc hoặc báo "Lỗi máy chủ nội bộ".
  5. **Ghi Log (Dành cho Lập trình viên)**: Dùng `Logger('CrisisManagementTeam')` in ra màn hình terminal chi tiết `đường dẫn`, `phương thức` và đặc biệt là đoạn `stack trace` để dev biết lỗi ở dòng code nào. Không gửi stack trace này cho client để bảo mật.
  6. **Trả về Client (Chuẩn hóa JSON)**:
     * `statusCode`: Mã lỗi HTTP.
     * `timestamp`: Thời gian xảy ra lỗi (chuẩn ISO).
     * `path`: Đường dẫn API bị lỗi.
     * `message`: Nếu là lỗi 500, trả về câu báo thân thiện: "Có sự cố xảy ra, chúng tôi đang xử lý. Xin lỗi bạn vì sự bất tiện này!". Nếu không, trả về thông báo lỗi (ví dụ: validation thất bại).

---

## 5. Guards (Lính Gác Bảo Vệ Route)
**File:** `src/common/guards/roles.guard.ts`

`RolesGuard` là "anh bảo vệ" đứng trước các route API, kiểm tra xem người dùng có quyền (role) hợp lệ để đi tiếp hay không.

* **Cách hoạt động**:
  1. Class kế thừa `CanActivate` của NestJS. Hàm `canActivate` sẽ trả về `true` (cho qua) hoặc `false` (chặn lại).
  2. Dùng `Reflector` (công cụ đọc metadata) để quét xem API hiện tại có gắn thẻ `@Roles` (đã định nghĩa ở phần 2) hay không.
  3. Nếu API không gắn thẻ `@Roles` (`!requiredRoles`), trả về `true` cho qua tự do.
  4. Lấy đối tượng `user` được đính kèm vào `request` (thường được gắn vào bởi `AuthGuard` chạy trước nó).
  5. So sánh `user.role` với danh sách quyền yêu cầu. Nếu người dùng không đăng nhập (không có user) hoặc `role` không nằm trong danh sách `requiredRoles`, ném ra lỗi `ForbiddenException` (Mã HTTP 403) với câu thông báo: *"Bạn không có quyền thực hiện thao tác này"*.

---

## 6. Interfaces (Giao Diện Chuẩn Dữ Liệu)
**File:** `src/common/interfaces/api-response.interface.ts`

Quy định cấu trúc chung (Schema) của toàn bộ dữ liệu trả về cho frontend, để frontend dễ dàng phân tích và xử lý chung.

* **`ApiResponse<T>`**: Phản hồi API cơ bản.
  * `success` (boolean): Thành công là `true`.
  * `data` (T): Dữ liệu chứa bên trong, có kiểu tổng quát `T`.
* **`PaginatedMeta`**: Siêu dữ liệu dùng cho phân trang.
  * `total` (number): Tổng số item thỏa mãn điều kiện tìm kiếm.
  * `page` (number): Trang hiện tại.
  * `limit` (number): Số lượng item trên một trang.
  * `totalPages` (number): Tổng số trang.
* **`PaginatedApiResponse<T>`**: Phản hồi API danh sách có phân trang.
  * `success` (boolean): Bằng `true`.
  * `data` (`T[]`): Mảng dữ liệu.
  * `meta` (`PaginatedMeta`): Các thông số phục vụ vẽ giao diện phân trang.

---

## 7. Utils (Hàm Tiện Ích Trợ Giúp)
**File:** `src/common/utils/api-response.util.ts`

Chứa các hàm tạo sẵn (Helper/Factory function) để bọc dữ liệu vào chuẩn Response Interface ở trên thay vì tạo thủ công bằng tay.

* **Hàm `success<T>(data: T): ApiResponse<T>`**
  * **Input**: Dữ liệu thô (ví dụ: object user, danh sách giỏ hàng...).
  * **Output**: Trả về cấu trúc JSON thống nhất `{ success: true, data: [dữ liệu thô] }`.
* **Hàm `paginated<T>(data: T[], total: number, page: number, limit: number): PaginatedApiResponse<T>`**
  * **Input**: Mảng dữ liệu hiện tại, tổng toàn bộ record, số trang hiện tại, kích thước trang.
  * **Output**: Trả về JSON bao gồm `success: true`, `data`, và tự động tính toán ra block `meta`.
  * **Logic tính `totalPages`**: Sử dụng công thức `Math.ceil(total / limit)`. Nếu `total` bằng `0` thì trả về `0` trang. 

--- 
**Tóm lược:** Nhờ có module `common` này, lập trình viên không phải quan tâm đến việc tạo JSON format chuẩn, không phải viết lại code phân quyền, hay xử lý lỗi chung chung nữa. Họ chỉ việc tập trung vào logic cốt lõi. Cấu trúc chuẩn hóa sẽ giúp dự án dễ mở rộng, code dễ đọc hơn!