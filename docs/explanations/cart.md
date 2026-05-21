# Giải Thích Chi Tiết - Module Cart (`src/cart`)

Module này quản lý toàn bộ vòng đời của giỏ hàng người dùng, từ lúc thêm sản phẩm cho đến khi sẵn sàng chuyển sang giai đoạn thanh toán (Checkout).

## 1. Controller: `CartController` (`cart.controller.ts`)
Tất cả các endpoint trong Controller này đều được bảo vệ bởi `@UseGuards(AuthGuard)`, yêu cầu người dùng phải đăng nhập.

### `GET /cart`
- **Chức năng:** Lấy thông tin giỏ hàng hiện tại của người dùng.
- **Dữ liệu vào:** `userId` trích xuất từ JWT Payload trong `request.user`.
- **Dữ liệu trả về:** `ApiResponse<CartResponse>`.
  - Bao gồm danh sách các sản phẩm, tổng số lượng và tổng tiền.

### `POST /cart/items`
- **Chức năng:** Thêm một sản phẩm vào giỏ hàng.
- **Dữ liệu vào:**
  - `userId` từ Token.
  - Body (`AddCartItemDto`):
    - `productId`: ID của sản phẩm (Kiểu `number`, bắt buộc, phải là số dương).
    - `quantity`: Số lượng muốn thêm (Kiểu `number`, bắt buộc, phải là số dương).
- **Dữ liệu trả về:** `ApiResponse<CartResponse>` (Giỏ hàng mới nhất sau khi thêm).

### `PATCH /cart/items/:id`
- **Chức năng:** Cập nhật số lượng của một mục (item) cụ thể đã có trong giỏ hàng.
- **Dữ liệu vào:**
  - Param `id`: ID của `CartItem` (không phải productId).
  - Body (`UpdateCartItemDto`):
    - `quantity`: Số lượng mới (Kiểu `number`, bắt buộc, phải là số dương).
- **Dữ liệu trả về:** `ApiResponse<CartResponse>`.

### `DELETE /cart/items/:id`
- **Chức năng:** Xóa hoàn toàn một mục khỏi giỏ hàng.
- **Dữ liệu vào:** Param `id` (ID của `CartItem`).
- **Dữ liệu trả về:** `ApiResponse<CartResponse>`.

### `DELETE /cart`
- **Chức năng:** Làm trống toàn bộ giỏ hàng (xóa tất cả các mục).
- **Dữ liệu trả về:** `ApiResponse<CartResponse>`.

---

## 2. Service: `CartService` (`cart.service.ts`)
Chứa logic nghiệp vụ xử lý dữ liệu, tương tác với Database (Prisma) và Cache (Redis).

### Các phương thức chính:
- **`getCart(userId)`**: 
  - Sử dụng cơ chế `getOrSet` của Redis.
  - Key cache: `cart:{userId}`. TTL: Theo cấu hình `CACHE_TTL.CART`.
  - Nếu Cache miss: Gọi `getCartWithItems` để truy vấn DB và sau đó `serializeCart` để chuẩn hóa dữ liệu.
- **`addItem(userId, dto)`**:
  - Gọi `validateProductAvailability` để kiểm tra: Sản phẩm có tồn tại? Có đang ACTIVE? Có đủ hàng trong kho (`stock`)?
  - Gọi `getOrCreateActiveCart` để đảm bảo luôn có một giỏ hàng trạng thái `ACTIVE`.
  - Kiểm tra nếu sản phẩm đã tồn tại trong giỏ (`cartId_productId` unique):
    - Nếu có: Cộng thêm `quantity` và kiểm tra lại giới hạn tồn kho.
    - Nếu chưa: Tạo bản ghi `CartItem` mới.
  - Cuối cùng gọi `refreshCart(userId)` để xóa cache cũ và trả về giỏ hàng mới.
- **`updateItem(userId, itemId, dto)`**:
  - Xác thực quyền sở hữu: Đảm bảo `itemId` thuộc về giỏ hàng `ACTIVE` của chính người dùng đó thông qua `findOwnedCartItem`.
  - Kiểm tra tồn kho của sản phẩm liên quan.
  - Cập nhật số lượng mới vào DB.
- **`removeItem(userId, itemId)`**:
  - Xác thực quyền sở hữu mục giỏ hàng.
  - Thực hiện xóa cứng (Hard Delete) bản ghi `CartItem`.
- **`clearCart(userId)`**:
  - Xóa tất cả các `CartItem` liên kết với `cartId` đang hoạt động của người dùng.

### Các phương thức hỗ trợ nội bộ (Private):
- **`getOrCreateActiveCart`**: Tìm giỏ hàng có `status: ACTIVE`. Nếu không có, tự động tạo mới một bản ghi `Cart` cho người dùng.
- **`getCartWithItems`**: Truy vấn Database sử dụng Prisma, `include` thêm thông tin sản phẩm (`product`) để tính toán giá.
- **`validateProductAvailability`**: Ném lỗi `NotFoundException` nếu không thấy sản phẩm, hoặc `BadRequestException` nếu sản phẩm ngừng bán/hết hàng.
- **`findOwnedCartItem`**: Một lớp bảo mật quan trọng, ngăn chặn người dùng này sửa đổi hoặc xóa mục trong giỏ hàng của người dùng khác bằng cách kiểm tra mối quan hệ `cart.userId`.
- **`serializeCart`**: 
  - Sử dụng `Prisma.Decimal` cho các phép tính tài chính để tránh lỗi sai số dấu phẩy động.
  - Tính `subtotal` cho từng dòng: `product.price * quantity`.
  - Tính tổng số lượng `totalItems` và tổng tiền `subtotal` của cả giỏ hàng.

---

## 3. Luồng Dữ Liệu & Xử Lý Lỗi

### Luồng dữ liệu (Data Flow):
1. **Request:** Người dùng gửi yêu cầu kèm Header `Authorization: Bearer <token>`.
2. **Auth Guard:** Xác thực Token, nếu hợp lệ sẽ gán `user` vào `request`.
3. **Controller:** Nhận DTO từ Body, ID từ Param. Chuyển tiếp đến Service.
4. **Service:** 
   - Kiểm tra nghiệp vụ (Validate).
   - Tương tác Prisma (PostgreSQL) để thay đổi trạng thái dữ liệu.
   - Quản lý Cache (Redis): Xóa cache khi dữ liệu thay đổi (`refreshCart`).
5. **Serialization:** Chuyển đổi Decimal thành String để trả về Client (tránh mất độ chính xác khi JSON parse ở frontend).
6. **Response:** Trả về kết quả thông qua hàm `success()` của `ApiResponse`.

### Xử lý lỗi (Error Handling):
- **Sản phẩm không tồn tại:** Ném `NotFoundException`.
- **Hết hàng/Sản phẩm ẩn:** Ném `BadRequestException` kèm thông báo "Sản phẩm không đủ hàng" hoặc "Sản phẩm không còn bán".
- **Không tìm thấy Item trong giỏ:** Ném `NotFoundException` khi cố gắng sửa/xóa một `itemId` không thuộc quyền sở hữu.
- **Lỗi hệ thống:** Được bắt bởi `AllExceptionsFilter` toàn cục.

---

## 4. Cấu trúc Dữ liệu Phản hồi (`CartResponse`)
Mọi phản hồi liên quan đến giỏ hàng đều tuân theo cấu trúc:
```typescript
{
  "id": number,        // ID của giỏ hàng
  "items": [           // Danh sách các mục
    {
      "id": number,
      "productId": number,
      "name": string,
      "slug": string,
      "price": string,    // Decimal dạng chuỗi
      "quantity": number,
      "subtotal": string  // price * quantity
    }
  ],
  "totalItems": number,   // Tổng số lượng các sản phẩm (sum of quantities)
  "subtotal": string      // Tổng tiền của cả giỏ hàng
}
```

---
*Tài liệu này được cập nhật và phân tích sâu bởi Gemini CLI.*
