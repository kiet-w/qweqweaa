# 🏢 BẢN ĐỒ TỔ HỢP NHÀ HÀNG NESTJS (ENTERPRISE MENTAL MODEL)

Để hiểu thấu đáo kiến trúc phức tạp của NestJS và hệ thống Database đi kèm, hãy hình tượng hóa toàn bộ dự án của chúng ta thành một **Tổ hợp Nhà Hàng Cao Cấp** hoạt động với quy trình cực kỳ nghiêm ngặt. Dưới đây là bản đồ nhân sự và chuỗi cung ứng đầy đủ:

## 1. Ban Quản Lý & Mặt Tiền (Core & DI)
Sự nhầm lẫn lớn nhất của người mới học NestJS là nghĩ `Module` thực hiện việc cấp phát. Thực tế:

*   **`main.ts` (Anh Lễ Tân Gác Cửa):** Người đầu tiên khách gặp. Anh này cài đặt các quy tắc cơ bản ngay cửa vào, ví dụ: "Khách vào phải trình thẻ (cookie-parser) tui mới cho qua!".
*   **`app.module.ts` (Bản Khai Nhân Sự / Hợp đồng lao động):** Đây KHÔNG PHẢI là Tổng Giám Đốc. Đây chỉ là một tờ giấy danh sách ghi rõ: Nhà hàng có bao nhiêu phòng ban (Auth, User), ai làm nhiệm vụ gì, bộ phận nào đang kết nối với nguồn cung cấp nào.
*   **NestJS IoC Runtime (Phòng HR / Tổng Giám Đốc thực sự):** Khi nhà hàng mở cửa, Phòng HR sẽ đọc bản khai `app.module.ts`. Sau đó, họ gọi từng người tới và **tự động dúi vào tay họ** những công cụ cần thiết. Quá trình này gọi là **Dependency Injection (DI)**.
*   **`@Injectable()` (Thẻ Nhân Viên & Phân Quyền):** Nhờ có thẻ này, nhân viên không cần tự chạy đi kiếm công cụ. Ngay khi bắt đầu ca làm (`constructor`), Phòng HR đã tự động đẩy xe tủ lạnh mini (`redis.service`) và giao chìa khóa kho (`prisma.service`) vào tận tay Bếp Trưởng. Bếp Trưởng chỉ việc đứng yên một chỗ và xài.

## 2. Đội Ngũ Tiếp Khách & An Ninh (Controllers, DTO, Guards)
Nơi trực tiếp giao tiếp với khách hàng (tiếp nhận HTTP Request).

*   **`Controllers` (Đội ngũ Bồi Bàn):** Gồm Bồi bàn quầy Đăng ký (`auth.controller.ts`) và Bồi bàn khu vực VIP (`user.controller.ts`). Họ chạy ra bàn nhận yêu cầu từ khách và truyền đạt vào bếp. Tuyệt đối không ló mặt vào bếp tự nấu.
*   **`DTO - Data Transfer Object` (Tờ Phiếu Gọi Món):** Form điền sẵn do nhà hàng cấp. Khách ghi sai form (ví dụ: email thiếu chữ `@`, mật khẩu quá ngắn), bồi bàn nhìn qua là xé nháp trả lại ngay lập tức, không thèm đưa vào bếp làm phiền Đầu Bếp.
*   **`auth.guard.ts` (Anh Bảo Vệ / Bouncer):** Đứng gác trước cửa khu vực Dashboard VIP. Anh ta không chỉ săm soi vé (JWT/Cookie) mà còn xét duyệt quyền. Vé hết hạn, vé giả, hoặc khách thường đòi vào phòng Admin là ảnh đuổi thẳng ra ngoài sân (`UnauthorizedException` / `ForbiddenException`).

## 3. Khu Vực Bếp Chuyên Môn (Services)
Nơi xào nấu dữ liệu và xử lý logic nghiệp vụ, tuyệt đối không ló mặt ra ngoài gặp khách.

*   **`auth.service.ts` (Bếp Trưởng Phụ Trách An Ninh):** Người nắm giữ công thức bí mật. Chuyên băm nát thông tin nhạy cảm (bcrypt) và đóng dấu niêm phong mộc đỏ lên các tấm thẻ ra vào (jwt.sign).
*   **`user.service.ts` (Bếp Trưởng Chăm Sóc Hội Viên):** Chuyên gia chế biến các món ăn liên quan đến thông tin người dùng. Khi bồi bàn báo có khách muốn xem danh sách, anh này sẽ xắn tay áo lên đi gom nguyên liệu.

## 4. Chuỗi Cung Ứng & Lưu Trữ (Prisma & Redis)
Đây là hệ thống hậu cần quan trọng nhất, quyết định nhà hàng phục vụ nhanh hay chậm.

*   **`redis.service.ts` (Tủ Lạnh Mini Tốc Độ Cao):** Đặt ngay cạnh tay Đầu Bếp. Chứa các nguyên liệu làm sẵn hoặc món khách gọi liên tục (Cache). Bếp cứ mở tủ ra là chộp lấy ngay cực kỳ lẹ. Nhưng tủ này nhỏ, mất điện là đồ ăn bay sạch.
*   **`prisma.service.ts` (Trưởng Phòng Vật Tư):** Nắm chìa khóa của đường hầm dẫn ra Kho Tổng Khổng Lồ (PostgreSQL). Khi Tủ Lạnh Mini hết đồ, Đầu Bếp phải nhờ anh Vật Tư này xách xe đẩy xuống kho để lấy dữ liệu.
*   **`schema.prisma` (Bản Đồ Thiết Kế Kho):** Bản vẽ quy định rõ Kho Tổng có mấy kệ (Table), kệ User chứa những loại thùng gì, và nó nối với kệ Post bằng hệ thống băng chuyền nào (Quan hệ 1-N).
*   **`migrations/` (Sổ Nhật Ký Xây Kho):** Ghi chép lại lịch sử nâng cấp nhà hàng. Ví dụ: "Sáng 14/05 thợ xây thêm cái kệ Password, chiều cùng ngày xây thêm ngăn Refresh Token".
*   **`seed.ts` (Chuyến Xe Tải Mở Hàng):** Xe chở nguyên liệu mẫu (dữ liệu giả) đổ vào kho lúc nhà hàng vừa xây xong để nhân viên có đồ tập nấu ăn, hoặc dùng để reset lại kho khi cần.

---

## 5. Vòng Đời Phục Vụ Cố Định (The Request Pipeline)
Ngoài các bộ phận trên, NestJS có một quy trình giám sát cực kỳ gắt gao. Từ lúc khách yêu cầu đến lúc nhận món, phải đi qua đúng thứ tự:

1. **`Middleware`:** Bảo vệ vòng ngoài (Ghi log IP, Rate limit).
2. **`Guard` (Bảo Vệ):** Kiểm duyệt vé và quyền hạn cửa VIP.
3. **`Interceptor - Trước` (Anh Quay Phim):** Đứng cửa bếp, bấm "Record" đo thời gian nấu, có thể sơ chế thêm input trước khi đưa Bếp.
4. **`Pipe`:** Người rà soát lỗi chính tả trên tờ DTO, **đồng thời đổi kiểu dữ liệu nếu cần** (ví dụ: tự động biến chuỗi `"123"` thành con số `123` trước khi đưa vào bếp).
5. **`Controller` & `Service`:** Bồi bàn chuyển order cho Bếp Trưởng xào nấu.
6. **`Interceptor - Sau` (Anh Quay Phim QC):** Bấm "Stop", gắp bỏ bớt mấy cọng hành (xóa password khỏi data) trước khi bưng ra.
7. **`Exception Filter` (Đội Xử Lý Khủng Hoảng):** Lực lượng cứu hỏa túc trực 24/7. **Họ bắt lỗi ở MỌI TẦNG**. Không chỉ Bếp làm rớt đĩa, mà kể cả Anh Bảo Vệ (`Guard`) xô xát với khách, hay `Pipe` xé nhầm giấy, đội này đều nhảy vào dọn dẹp và mang ra thông báo lịch sự: "Dạ nhà hàng đang có sự cố nhỏ, mong quý khách thông cảm".

---

## 6. Mô Phỏng Quy Trình Phục Vụ 1 Đơn Hàng

**Tình huống:** Khách gọi món: "Cho tui xem danh sách người dùng trên hệ thống!"

1. **Chặn cửa:** Khách bị Anh Bảo Vệ (`auth.guard`) chặn lại soát vé (Cookie/JWT). Vé chuẩn, mời vào!
2. **Order:** Anh Bồi bàn (`user.controller`) ghi nhận tờ phiếu yêu cầu (`DTO`), anh `Pipe` xác nhận hợp lệ và chuẩn hóa dữ liệu. Bồi bàn chạy thẳng vào bếp báo cho Bếp Trưởng Hội Viên (`user.service`).
3. **Kiểm tra tủ lạnh:** Bếp Trưởng không chạy xuống kho vội. Anh ta ngó vào Tủ Lạnh Mini (`redis.service`) xem hôm qua có ai gọi món này chưa, đồ làm sẵn còn không.
4. **Xuống kho tổng (Nếu tủ lạnh trống):** Bếp Trưởng gọi anh Vật Tư (`prisma.service`) cầm Bản Đồ Kho (`schema.prisma`) chạy xuống hầm PostgreSQL lấy đúng danh sách người dùng lên.
5. **Trả món:** Bếp Trưởng ném một bản sao vào Tủ Lạnh Mini để mốt xài tiếp, rồi bưng khay dữ liệu đi qua trạm kiểm tra của `Interceptor` (xóa password), sau đó đưa Bồi bàn mang lên cho khách. Khách hàng hài lòng, đánh giá 5 sao!

---

## 7. Tuyệt Chiêu Xử Lý Đơn Hàng Phức Tạp (Transactions & ACID)
Khi khách gọi một **"Combo Đặc Biệt"** (Ví dụ: Vừa trừ tiền trong ví, vừa thêm điểm tích lũy VIP, vừa tạo hóa đơn), Đầu Bếp phải dùng tuyệt chiêu **`Prisma $transaction`**. Tuyệt chiêu này tuân thủ nghiêm ngặt 4 bộ luật An Toàn Thực Phẩm **A.C.I.D**:

*   **A - Atomicity (Toàn Vẹn - Tất cả hoặc Không có gì):** Giống như bưng ra một mâm Combo 3 món. Nếu đang nấu món thứ 3 mà phát hiện hết thịt, Bếp Trưởng sẽ **hủy luôn cả khay đồ ăn đó (Rollback)** và trả lại tiền cho khách. Tuyệt đối không phục vụ 2 món nhưng lấy đủ tiền.
*   **C - Consistency (Nhất Quán - Đúng luật):** Sau khi dọn Combo xong, mọi sổ sách phải khớp nhau. Kho (`Database`) trừ đi 1 miếng thịt thì két sắt phải cộng thêm $10. Lệch sổ là quản lý bắt hủy toàn bộ thao tác.
*   **I - Isolation (Độc Lập - Không giành giật):** Bàn A và Bàn B cùng gọi món cuối cùng có thịt bò. Quy trình Isolation đảm bảo Bếp Trưởng sẽ **khóa (Lock)** miếng thịt lại cho đơn order tới trước. Bàn B phải đứng xếp hàng chờ, không được phép hai bồi bàn cùng thò tay vào tủ lạnh tranh nhau 1 miếng thịt.
*   **D - Durability (Bền Vững - Mất điện không mất tiền):** Một khi Đầu Bếp đã báo "Combo hoàn tất", hóa đơn đã được in ra máy tính tiền (Lưu thành công vào Database). Dù ngay giây phút tiếp theo nhà hàng bị sét đánh sập server, thì sáng hôm sau mở lại, hóa đơn và số tiền đó vẫn nằm an toàn trong két sắt.
