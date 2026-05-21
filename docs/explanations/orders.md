# Giải Thích Chi Tiết - Module Orders (`src/orders`)

Module Orders là trái tim của sàn thương mại điện tử, xử lý bước quan trọng nhất: **Thanh toán (Checkout)** và **Quản lý Đơn Hàng**. Nơi này cực kỳ nhạy cảm, sai một dòng code có thể dẫn đến thất thoát tiền hoặc bán lố số lượng hàng trong kho.

## 1. Cấu trúc Module (`orders.module.ts`)
- **Imports:** `AuthModule` (để bảo vệ các endpoint bằng Guard).
- **Controllers:** `OrdersController` (Định tuyến yêu cầu liên quan đến đơn hàng).
- **Providers:** `OrdersService` (Xử lý nghiệp vụ chính).
- **Exports:** `OrdersService` (Cho phép module khác sử dụng nếu cần).

## 2. Controller (`orders.controller.ts`)
Tất cả endpoints trong controller này đều yêu cầu xác thực thông qua `@UseGuards(AuthGuard)`. Tiền tố URL chung là `/orders`.

### 2.1. Thanh toán (`POST /orders/checkout`)
- **Mục đích:** Xử lý giỏ hàng hiện tại của người dùng, thanh toán và tạo đơn hàng.
- **Inputs (Đầu vào):**
  - **Request user (`request.user`):** Lấy `userId` từ payload của JWT.
  - **Body (`CheckoutDto`):**
    - `address` (string): Địa chỉ giao hàng. Yêu cầu không rỗng (`@IsNotEmpty()`) và có độ dài tối thiểu 10 ký tự (`@MinLength(10)`).
- **Service được gọi:** `ordersService.checkout(request.user.userId, dto)`.
- **Output (Đầu ra):** Dữ liệu đơn hàng định dạng `OrderResponse` bọc trong `success()`.

### 2.2. Lấy danh sách đơn hàng (`GET /orders`)
- **Mục đích:** Lấy toàn bộ lịch sử mua hàng của người dùng hiện tại.
- **Inputs:**
  - **Request user (`request.user`):** Lấy `userId`.
- **Service được gọi:** `ordersService.findOrders(request.user.userId)`.
- **Output:** Mảng `OrderResponse` bọc trong `success()`.

### 2.3. Lấy chi tiết đơn hàng (`GET /orders/:id`)
- **Mục đích:** Xem chi tiết một đơn hàng cụ thể của người dùng.
- **Inputs:**
  - **Request user (`request.user`):** Lấy `userId`.
  - **Param `id`:** ID của đơn hàng (được ép kiểu sang số qua `ParseIntPipe`).
- **Service được gọi:** `ordersService.findOrderById(request.user.userId, id)`.
- **Output:** Dữ liệu đơn hàng `OrderResponse` bọc trong `success()`.

---

## 3. Service (`orders.service.ts`)
Service chứa toàn bộ logic nghiệp vụ cốt lõi. Quá trình thanh toán đặc biệt quan trọng và được bọc trong database transaction để đảm bảo toàn vẹn dữ liệu.

### 3.1. Kiểu dữ liệu trả về (`OrderResponse`)
Chuẩn hóa dữ liệu trả về từ database để giấu đi các trường không cần thiết và chuyển kiểu `Decimal` thành `String` an toàn cho JSON:
- `id` (number)
- `status` (OrderStatus)
- `total` (string)
- `address` (string)
- `createdAt` (Date)
- `updatedAt` (Date)
- `items`: Mảng chi tiết sản phẩm gồm: `id`, `productId`, `productName`, `productPrice` (string), `quantity`, `subtotal` (string).

### 3.2. Hàm `checkout(userId: number, dto: CheckoutDto)`
Đây là hàm phức tạp nhất. Nó được đặt trong một khối **Database Transaction** (`this.prisma.$transaction`).
**Tại sao phải dùng `$transaction`?** 
Khi thanh toán, hệ thống thực hiện nhiều bước (tạo đơn, tạo item, trừ kho, đóng giỏ hàng). Nếu có lỗi giữa chừng (ví dụ: kho hết hàng ở sản phẩm cuối cùng), toàn bộ các thao tác trước đó phải tự động được Rollback (hủy bỏ) như chưa từng xảy ra.

**Luồng dữ liệu (Data flow) & Bắt lỗi (Error Handling):**
1. **Lấy giỏ hàng (Cart):**
   - Tìm giỏ hàng có trạng thái `ACTIVE` của người dùng. Include cả `items` và chi tiết `product`.
   - *Error Handling:* Nếu giỏ không tồn tại hoặc `items.length === 0` $\rightarrow$ Ném `BadRequestException('Giỏ hàng trống')`.
2. **Kiểm tra tính hợp lệ của sản phẩm:**
   - Lặp qua từng `item` trong giỏ hàng:
     - Nếu sản phẩm bị ẩn/khóa (`status !== ACTIVE`) hoặc đã bị xóa (`deletedAt` có giá trị) $\rightarrow$ Ném `BadRequestException('Sản phẩm không còn bán')`.
     - Nếu tồn kho thực tế nhỏ hơn số lượng trong giỏ (`stock < quantity`) $\rightarrow$ Ném `BadRequestException('Sản phẩm không đủ hàng')`.
3. **Chuẩn bị dữ liệu Đơn hàng:**
   - Map danh sách giỏ hàng thành `orderItemsData` (gồm productId, productName, productPrice, quantity, subtotal).
   - *Subtotal* được tính bằng `product.price.mul(quantity)`.
   - Tính tổng tiền của đơn hàng (`total`) bằng cách cộng dồn các subtotal bằng kiểu `Prisma.Decimal`.
4. **Tạo mới Đơn hàng (Order):**
   - Lưu bản ghi vào bảng `Order` với trạng thái `PENDING`, tổng tiền, địa chỉ giao hàng (`dto.address`). Đồng thời tạo các `items` thông qua nested relation.
5. **Trừ Tồn kho (Cực kỳ quan trọng - Optimistic Locking):**
   - Với mỗi sản phẩm, thực hiện `tx.product.updateMany`.
   - *Điều kiện (Where):* ID khớp, trạng thái `ACTIVE`, không bị xóa, và đặc biệt: `stock: { gte: item.quantity }` (Chỉ update nếu tồn kho $\ge$ lượng mua).
   - *Hành động (Data):* `stock: { decrement: item.quantity }` (Trừ đi lượng mua).
   - *Error Handling:* Nếu `updated.count !== 1` (do ai đó mua tranh dẫn đến không thỏa mãn điều kiện `gte`) $\rightarrow$ Ném `BadRequestException('${item.product.name} không đủ hàng')`. Đây là kỹ thuật giúp tránh Race Condition (lỗi âm kho).
6. **Đóng Giỏ hàng:**
   - Cập nhật trạng thái giỏ hàng hiện tại thành `COMPLETED`.
7. **Trả về kết quả:**
   - Log giao dịch thành công. Gọi hàm `serializeOrder` để định dạng lại trước khi trả cho controller.
   - Nếu có exception, log lỗi ở dạng warning và đẩy lỗi ra cho cơ chế filter của NestJS xử lý.

### 3.3. Hàm `findOrders(userId: number)`
- **Mục đích:** Lấy lịch sử tất cả các đơn hàng.
- **Logic:** Query bảng `Order` dựa vào `userId`, sắp xếp theo thứ tự `createdAt: 'desc'` (mới nhất lên đầu). Kèm theo thông tin `items`.
- **Trả về:** Mảng các đơn hàng đã được format qua `serializeOrder`.

### 3.4. Hàm `findOrderById(userId: number, orderId: number)`
- **Mục đích:** Xem chi tiết một đơn hàng.
- **Logic:** Query đơn hàng phải thỏa mãn đồng thời `id = orderId` và `userId = userId` (bảo vệ quyền truy cập, không cho xem đơn của người khác).
- **Error Handling:** Nếu không tìm thấy $\rightarrow$ Ném `NotFoundException('Không tìm thấy đơn hàng')`.
- **Trả về:** Đơn hàng được format qua `serializeOrder`.

### 3.5. Hàm `serializeOrder(order)`
- **Mục đích:** Helper function riêng của service để chuyển đổi các trường dữ liệu `Decimal` (Prisma format) từ Database sang dạng `String` (để an toàn khi trả về client bằng JSON). Xây dựng cấu trúc Object chuẩn bám sát kiểu `OrderResponse`.