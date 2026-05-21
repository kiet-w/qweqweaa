# Giải Thích Chi Tiết - Module Catalog (`src/catalog`)

Module Catalog đóng vai trò là "quầy trưng bày sản phẩm" của hệ thống (bao gồm danh mục, sản phẩm, tìm kiếm, và lọc giá). Điểm nhấn quan trọng nhất của module này là **hiệu năng (Performance)** và **tối ưu hóa bộ nhớ đệm (Caching)** vì đây là module có lượng truy cập (read) cao nhất trong ứng dụng e-commerce.

---

## 1. Controller: `catalog.controller.ts`

Controller này định nghĩa các endpoints phục vụ cho người dùng cuối (customer) để duyệt danh mục và sản phẩm.

### 1.1 Lấy Danh Sách Danh Mục
- **Endpoint:** `GET /categories`
- **Đầu vào (Input):** Không có
- **Đầu ra (Output):** Danh sách các danh mục, được bọc trong định dạng `success(...)`.
- **Luồng xử lý:** Gọi đến `catalogService.findCategories()`.

### 1.2 Lấy Danh Sách Sản Phẩm (Có Phân Trang, Lọc & Tìm Kiếm)
- **Endpoint:** `GET /products`
- **Đầu vào (Query Parameters / DTO):** `ProductQueryDto` (Kế thừa từ `PaginationQueryDto`). Các trường gồm:
  - `page` (number): Trang hiện tại (Mặc định: 1)
  - `limit` (number): Số lượng trên một trang (Mặc định: 10, Tối đa: 100)
  - `search` (string, tuỳ chọn): Chuỗi tìm kiếm.
  - `category` (number, tuỳ chọn): ID của danh mục.
  - `minPrice` (string, tuỳ chọn): Giá trị giá thấp nhất.
  - `maxPrice` (string, tuỳ chọn): Giá trị giá cao nhất.
  - `sort` (string, tuỳ chọn): Tiêu chí sắp xếp (`'price_asc'`, `'price_desc'`, `'created_asc'`, `'created_desc'`. Mặc định: `'created_desc'`).
- **Đầu ra (Output):** Kết quả được bọc bằng hàm tiện ích `paginated(data, total, page, limit)`.
- **Luồng xử lý:** Gọi đến `catalogService.findProducts(query)`.

### 1.3 Lấy Chi Tiết Sản Phẩm Theo Slug
- **Endpoint:** `GET /products/:slug`
- **Đầu vào (Path Parameter):** `slug` (string) - Đường dẫn thân thiện của sản phẩm.
- **Đầu ra (Output):** Thông tin chi tiết của 1 sản phẩm được bọc qua `success(product)`. Trả về mã lỗi 404 (Not Found) nếu không tồn tại.
- **Luồng xử lý:** Gọi đến `catalogService.findProductBySlug(slug)`.

---

## 2. Service: `catalog.service.ts`

Service này chứa toàn bộ business logic. Sự chú ý đặc biệt được đặt vào **Redis Caching** giúp giảm tải trực tiếp cho Database.

### 2.1 Phương thức `findCategories()`
- **Chức năng:** Lấy toàn bộ danh sách Category. Sắp xếp theo tên tăng dần (`asc`).
- **Tương tác Redis:** Cache lại dữ liệu bằng `redisService.getOrSet` với key là hằng số `CACHE_KEYS.CATEGORIES`. Thời gian sống (TTL) là `CACHE_TTL.CATEGORIES`.
- **Tương tác Prisma:** `prisma.category.findMany` (Chỉ lấy các trường cần thiết: id, name, slug, description, createdAt, updatedAt).

### 2.2 Phương thức `findProducts(query: ProductQueryDto)`
Đây là phần lõi tối ưu hóa nhất của hệ thống phục vụ việc lấy danh sách sản phẩm.
- **Tính toán Pagination:** Chuyển đổi `page` và `limit` thành `skip` (số bản ghi bỏ qua) và `take` để Prisma truy vấn.
- **Tương tác Redis:**
  - Xây dựng Dynamic Cache Key: Gọi hàm `getProductsCacheKey` để tạo một key duy nhất dựa trên **tất cả** các tham số truy vấn (ví dụ: `products:list:page=1&limit=10&search=iphone&sort=price_asc`).
  - Sử dụng `redisService.getOrSet` để lấy hoặc lưu mới kết quả trong thời gian sống `CACHE_TTL.PRODUCTS`.
- **Xử lý Điều kiện (Filter):** Sử dụng hàm helper `buildProductWhere(query)` để tạo đối tượng điều kiện truy vấn DB (`Prisma.ProductWhereInput`):
  - Chỉ lấy sản phẩm đang hoạt động (`status: ACTIVE`) và chưa bị xóa mềm (`deletedAt: null`).
  - Tính năng tìm kiếm (search): Sử dụng toán tử `OR` để tìm chuỗi trong cột `name` hoặc `description` không phân biệt hoa thường (`mode: 'insensitive'`).
  - Lọc theo khoảng giá: Áp dụng `gte` (lớn hơn hoặc bằng minPrice) và `lte` (nhỏ hơn hoặc bằng maxPrice).
- **Tương tác Prisma:** 
  - Thực thi song song: Sử dụng `Promise.all` với `prisma.product.findMany` và `prisma.product.count` để lấy đồng thời dữ liệu sản phẩm và tổng số lượng thoả mãn điều kiện, giúp tối đa hóa tốc độ đọc. `findMany` có dùng `include` để nối bảng categories và images.
- **Chuẩn hóa (Serialization):** Dữ liệu thu được từ DB được đưa qua hàm `serializeProduct` để tinh gọn theo format `ProductListItem`, đồng thời chuyển giá tiền từ dạng Decimal về dạng chuỗi (string) để an toàn hiển thị.

### 2.3 Phương thức `findProductBySlug(slug: string)`
- **Chức năng:** Tìm chính xác 1 sản phẩm qua `slug` cùng với ảnh và danh mục tương ứng.
- **Tương tác Redis:** Lưu cache kết quả với key động riêng biệt (`CACHE_KEYS.PRODUCT(slug)`).
- **Tương tác Prisma:** `prisma.product.findFirst` theo slug, chỉ lấy hàng `ACTIVE` và chưa xóa. 
- **Xử lý lỗi:** Ném lỗi `NotFoundException('Sản phẩm không tồn tại')` nếu kết quả truy vấn rỗng. Trả về cấu trúc `ProductDetail` kế thừa các trường chuẩn hóa.

---

## 3. Data Flow và Luồng Chạy Điển Hình (Data Flow)

1. **User Request (Customer):** Khách hàng gọi API tìm kiếm hoặc lọc sản phẩm, ví dụ: `GET /products?search=laptop&sort=price_desc`.
2. **Controller (Routing):** Trình định tuyến của NestJS sẽ đưa request vào `CatalogController`. Request được pipe qua Validation của `ProductQueryDto` và gửi dữ liệu sạch xuống `CatalogService`.
3. **Service (Cache Check):** Phương thức `findProducts` tính toán Cache Key, ví dụ thành chuỗi định danh: `products:list:page=1&limit=10&search=laptop&sort=price_desc`. Dịch vụ Redis tra cứu key này:
    - **Cache Hit:** Nếu đã có người truy cập URL/tìm kiếm tương tự trong khoảng thời gian TTL, kết quả có sẵn trên RAM (Redis) được bốc ra trả lại ngay lập tức. Bỏ qua bước 4 và 5.
    - **Cache Miss:** Nếu chưa có dữ liệu trong bộ nhớ đệm, sẽ tiếp tục xuống bước 4.
4. **Service (Database Query):** 
    - Sinh object điều kiện `where` và tiêu chí sắp xếp `orderBy`.
    - Gửi đồng thời hai truy vấn đến Postgres (qua Prisma) sử dụng `Promise.all` (lấy records & lấy con số tổng hợp).
5. **Service (Formatting & Cache Set):** 
    - Định dạng lại dữ liệu chuẩn qua `serializeProduct` (xóa bớt cột không cần thiết, parse Decimal).
    - Dữ liệu hoàn chỉnh cuối cùng được lưu vào Redis với key sinh ra ở bước 3.
6. **Controller (Response):** Dùng wrapper `paginated` trả chuẩn HTTP về với thông tin meta đầy đủ (số page, tổng total items, limit đang áp dụng).

---

## 4. Các Utility Methods (Service Private Methods)
- `buildProductWhere`: Phương thức lắp ráp câu truy vấn linh động `Prisma.ProductWhereInput` sử dụng cú pháp Spread của JS (`...`). Nó hỗ trợ map các giá trị `search`, `category`, `minPrice`, `maxPrice` thành SQL condition.
- `getProductOrderBy`: Đọc chuỗi `sort` và dịch ra object `{ field: 'asc'|'desc' }` cho câu query Prisma.
- `getProductsCacheKey`: Sử dụng `URLSearchParams` để tổng hợp tất cả params tìm kiếm và tạo ra 1 đoạn String chuẩn dùng làm ID trong kho lưu trữ Redis (Redis Cache Key).
- `serializeProduct`: Định dạng dữ liệu thô Prisma trả về theo Type `ProductListItem` chỉ với các dữ liệu Client cần xem, hạn chế leak (rò rỉ) dữ liệu nhạy cảm ra ngoài hoặc dữ liệu rác làm phình to HTTP Response payload.
