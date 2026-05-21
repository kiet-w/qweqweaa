# 🍳 BẢN ĐỒ MÔ TẢ HOẠT ĐỘNG NESTJS QUA MÔ HÌNH NHÀ HÀNG (RESTAURANT METAPHOR)

Để giúp bạn thấu hiểu toàn bộ luồng hoạt động của mã nguồn NestJS trong dự án này một cách dễ dàng và trực quan nhất, tài liệu này sẽ ví toàn bộ hệ thống Backend của bạn như một **Nhà hàng chuẩn 5 sao**. 

Mỗi thành phần trong thư mục `src` của bạn sẽ đóng một vai trò cực kỳ quan trọng trong hoạt động của nhà hàng này.

---

## 📸 SƠ ĐỒ HOẠT ĐỘNG TỔNG QUAN

Dưới đây là bức tranh trực quan mô tả luồng đi của một yêu cầu gọi món (HTTP Request) từ lúc thực khách bước vào nhà hàng cho đến khi món ăn được dọn lên:

![Bản đồ hoạt động nhà hàng](restaurant_flow_illustration.png)

---

## 🏪 CÁC THÀNH PHẦN TRONG NHÀ HÀNG TƯƠNG ỨNG VỚI CODE NESTJS

### 1. Tòa nhà Nhà hàng (`AppModule` & `main.ts`)
* **Trong đời thực**: Là toàn bộ mặt bằng, cơ sở vật chất của nhà hàng. Nơi định nghĩa khu vực sảnh, bếp, kho và mở cửa đón khách.
* **Trong code**: 
  * [src/main.ts](file:///home/baudui/Downloads/project/src/main.ts) là ngày khai trương, thiết lập cổng đón khách (ví dụ: cổng `3000`).
  * [src/app.module.ts](file:///home/baudui/Downloads/project/src/app.module.ts) là bộ khung liên kết tất cả các phòng ban (Module) lại với nhau thành một chỉnh thể.

### 2. Tiếp tân kiểm tra & Bảo vệ sảnh (`Guards` & `Pipes` — `src/common`)
Khi thực khách (Client/User) bước vào và gửi yêu cầu gọi món (Request):
* **Tiếp tân sảnh (Guards)**: 
  * Kiểm tra xem thực khách có thẻ VIP hoặc thẻ thành viên hợp lệ không (Kiểm tra Cookie JWT trong [src/auth/auth.guard.ts](file:///home/baudui/Downloads/project/src/auth/auth.guard.ts)).
  * Kiểm tra thực khách có quyền vào phòng VIP không (Kiểm tra quyền Admin trong `RolesGuard`). Nếu không hợp lệ, tiếp tân sẽ lịch sự mời ra ngoài (Lỗi `401 Unauthorized` hoặc `403 Forbidden`).
* **Người kiểm tra thực đơn gọi món (Pipes)**:
  * Khi thực khách viết phiếu gọi món, người này sẽ kiểm tra xem định dạng viết có đúng không (ví dụ: không được gọi "nửa đĩa mì", số lượng phải là số dương).
  * Trong code, `ValidationPipe` sử dụng các DTO để lọc sạch và validate dữ liệu rác trước khi truyền xuống bếp, tránh làm hỏng hệ thống.
* **Đội dọn dẹp sự cố (Exception Filters)**:
  * Nếu trong nhà hàng xảy ra sự cố (đổ vỡ, cháy bếp...), đội dọn dẹp (`AllExceptionsFilter`) sẽ lập tức xử lý và đưa ra lời xin lỗi có định dạng lịch sự, đồng nhất gửi tới thực khách thay vì để họ thấy cảnh hỗn loạn (Lỗi `500 Internal Server Error`).

### 3. Nhân viên phục vụ bàn (`Controllers` — `src/*/*.controller.ts`)
* **Trong đời thực**: Người đứng ở sảnh nhận thực đơn gọi món từ khách, chuyển phiếu gọi món vào cho bếp, và sau đó bưng món ăn thơm ngon ra bàn cho khách. Nhân viên phục vụ **không trực tiếp nấu ăn**.
* **Trong code**: Các Controller (như [src/catalog/catalog.controller.ts](file:///home/baudui/Downloads/project/src/catalog/catalog.controller.ts) hay [src/orders/orders.controller.ts](file:///home/baudui/Downloads/project/src/orders/orders.controller.ts)) chỉ định nghĩa các Route API (nhận Request), bóc tách tham số và chuyển giao việc xử lý cho Service. Controller **không chứa logic nghiệp vụ nặng**.

### 4. Đầu bếp trưởng (`Services` — `src/*/*.service.ts`)
* **Trong đời thực**: Là linh hồn của nhà hàng. Đầu bếp trưởng đứng trong bếp bếp nhận phiếu, tính toán nguyên liệu, chế biến món ăn ngon theo công thức bí truyền.
* **Trong code**: Các Service (như [src/orders/orders.service.ts](file:///home/baudui/Downloads/project/src/orders/orders.service.ts)) chứa toàn bộ logic nghiệp vụ (Business Logic) phức tạp của ứng dụng.

### 5. Tủ mát thức ăn nhanh / Đồ uống (`Redis Cache` — `src/redis`)
* **Trong đời thực**: Đặt ngay cạnh bếp nấu. Chứa các món làm sẵn rất nhanh hoặc đồ uống phổ biến (như Coca, Salad chế biến sẵn). Khách gọi là có ngay trong 1 giây, đầu bếp không cần nấu lại.
* **Trong code**: `RedisService` lưu trữ các dữ liệu ít thay đổi nhưng được đọc thường xuyên (như danh sách sản phẩm nổi bật trong `src/catalog`). Tốc độ phản hồi cực nhanh nhờ lưu trên RAM.

### 6. Kho nguyên liệu tổng của nhà hàng (`Prisma Database` — `src/prisma` & `prisma/schema.prisma`)
* **Trong đời thực**: Là phòng đông lạnh khổng lồ phía sau nhà hàng chứa gạo, bột mì, thịt tươi sống. Lấy đồ ở đây lâu hơn tủ mát (vì phải đi sâu vào kho) nhưng chứa được lượng dữ liệu khổng lồ và không bị mất đi khi nhà hàng đóng cửa buổi tối.
* **Trong code**: `PrismaService` tương tác trực tiếp với Database PostgreSQL/MySQL để lưu trữ vĩnh viễn dữ liệu tài khoản, sản phẩm, đơn hàng.

---

## 🔄 LUỒNG CODE HOẠT ĐỘNG THỰC TẾ (VÍ DỤ: ĐẶT HÀNG — CHECKOUT)

Hãy xem cách các phòng ban phối hợp nhịp nhàng khi khách thực hiện đặt hàng (`POST /orders/checkout`):

```
[Thực Khách (Client)]
       │
       ▼ (1) Gửi yêu cầu đặt hàng kèm theo Token VIP và danh sách món ăn muốn mua
[Tiếp tân (AuthGuard) & Người duyệt đơn (ValidationPipe)]
       │
       ├─► [Không hợp lệ] ──► [Đội dọn dẹp lỗi (Filter)] ──► Trả về lỗi 400/401 cho khách.
       │
       ▼ (2) Hợp lệ! Tiếp tân ghi chú: "Đây là khách hàng ID: 99"
[Nhân viên phục vụ (OrdersController)]
       │
       ▼ (3) Chuyển yêu cầu xuống bếp: "Nấu đơn hàng cho khách 99"
[Đầu bếp trưởng (OrdersService)]
       │
       ├─► (4) Kiểm tra nhanh nguyên liệu có sẵn tại tủ mát không? ──► [Redis Cache]
       │
       ├─► (5) Vào kho lớn lấy thịt, rau và kiểm tra tồn kho ──► [Prisma Database]
       │
       ├─► (6) [BƯỚC QUAN TRỌNG: GIAO DỊCH NGUYÊN TỬ - $transaction]
       │       Đầu bếp trưởng yêu cầu: "Tôi phải vừa trừ 2 cái cánh gà trong kho lớn, 
       │       vừa in hóa đơn tài chính cùng lúc. Nếu kho hết cánh gà, phải hủy đơn và hoàn tiền lại!"
       │
       ▼ (7) Nấu xong món ăn ngon lành!
[Nhân viên phục vụ (OrdersController)]
       │
       ▼ (8) Bưng món ăn kèm hóa đơn đẹp đẽ ra bàn
[Thực Khách (Client nhận JSON Response thành công)]
```

---

## 💡 BÀI HỌC KỸ THUẬT RÚT RA TỪ MÔ HÌNH NÀY

1. **Sự tách biệt trách nhiệm (Separation of Concerns)**:
   * Phục vụ bàn (`Controller`) tuyệt đối không nhảy vào bếp nấu ăn (`Service`).
   * Đầu bếp (`Service`) không được đứng ở cửa soát vé khách hàng (`Guard`).
   * Điều này giúp code cực kỳ sạch sẽ, khi hỏng bếp chỉ cần sửa bếp, khi tiếp tân nghỉ việc chỉ cần thay tiếp tân mà món ăn không bị ảnh hưởng.
2. **ACID Transaction trong `src/orders`**:
   * Khi bạn mua hàng, tiền phải trừ và hàng phải giao. Nếu một trong hai thứ thất bại, hệ thống phải trả lại nguyên trạng (Rollback). Đó chính là cách **Quản lý bếp** đảm bảo chất lượng.
3. **Cơ chế Hủy Cache (Cache Invalidation) trong `src/admin`**:
   * Khi Admin thêm món mới vào thực đơn, họ phải mở tủ mát (`Redis`) và vứt bỏ đĩa salad cũ đi để xếp đĩa salad mới vào. Nếu không khách hàng sẽ ăn phải món cũ (Dữ liệu cache bị outdate).

---
*Bản hướng dẫn này được lưu trữ tại [docs/NESTJS_RESTAURANT_METAPHOR.md](NESTJS_RESTAURANT_METAPHOR.md) để bạn dễ dàng tra cứu bất kỳ lúc nào.*
