# Redis trong Dự Án: Toàn Tập & Tầm Nhìn Enterprise

Dự án đã được refactor để sử dụng một `RedisModule` toàn cục. Tài liệu này đi sâu vào chi tiết kỹ thuật từng tính năng của Redis để bạn có thể tự tin áp dụng vào các hệ thống thực tế.

---

## 1. Cơ chế Caching (Tủ lạnh siêu tốc)

### Luồng hoạt động của `getOrSet`:
1. **Request:** Client gọi API.
2. **Check:** `RedisService` kiểm tra key trong Redis.
3. **Hit:** Nếu có dữ liệu (Cache Hit), trả về ngay lập tức (1-5ms).
4. **Miss:** Nếu không có (Cache Miss), thực hiện hàm callback để lấy từ PostgreSQL (50-200ms).
5. **Update:** Lưu kết quả vào Redis kèm theo thời gian sống (TTL).

### Ví dụ minh họa (Trong Service):
```typescript
async getProduct(id: string) {
  return await this.redisService.getOrSet(
    `product:${id}`, 
    async () => await this.prisma.product.findUnique({ where: { id } }),
    60000 // Lưu trong 1 phút
  );
}
```

---

## 2. Chi tiết các mảnh ghép Enterprise

### A. Rate Limiting (Phòng thủ đa tầng)
**Cơ chế:** Redis lưu một "Bucket" cho mỗi IP. Mỗi khi IP đó gọi API, bộ đếm sẽ tăng lên.
- **Cấu hình ví dụ:**
  ```typescript
  ThrottlerModule.forRoot([{
    ttl: 60000, // 1 phút
    limit: 10,   // Tối đa 10 lần gọi
    storage: new ThrottlerStorageRedisService(redisClient)
  }])
  ```
- **Tại sao cần Redis?** Nếu bạn có 5 server chạy song song, chỉ có Redis mới giúp tất cả server cùng biết một IP đang spam để chặn đồng bộ.

### B. Message Queues (Xử lý hậu trường với BullMQ)
**Mô hình:** `Producer` -> `Redis (Queue)` -> `Consumer`.
- **Ví dụ Gửi Email:**
  1. **Producer (Controller):** Nhận lệnh đăng ký, vứt một "Job" chứa email người dùng vào Redis.
  2. **Queue (Redis):** Giữ Job đó, đảm bảo không bị mất kể cả khi server sập.
  3. **Consumer (Worker Service):** Lấy Job ra, kết nối với Server Mail và gửi. Nếu lỗi, Redis sẽ tự động ra lệnh thử lại (Retry) sau 5 phút.
- **Ưu điểm:** Giải phóng tài nguyên cho Main Thread của NestJS, giúp ứng dụng không bao giờ bị "treo".

### C. Blacklist Token (Khoá bảo mật tức thì)
**Vấn đề:** JWT không thể thu hồi.
**Giải pháp:**
1. Khi User bấm **Logout**, lấy `jti` (ID của token) hoặc toàn bộ chuỗi Token.
2. Lưu vào Redis với key `blacklist:token_abc...` và đặt TTL bằng đúng thời gian còn lại của Token đó.
3. Tại **AuthGuard**, thêm một bước kiểm tra:
   ```typescript
   const isBlacklisted = await this.redisService.get(`blacklist:${token}`);
   if (isBlacklisted) throw new UnauthorizedException();
   ```

### D. Pub/Sub (Hệ thống liên lạc nội bộ)
**Ứng dụng:** Khi bạn chạy nhiều bản sao (Instances) của Server.
- **Kịch bản:** User 1 (nối Server A) nhắn tin cho User 2 (nối Server B).
- **Luồng:** 
  1. Server A gửi tin nhắn vào kênh `chat_channel` trên Redis.
  2. Server B (đang lắng nghe kênh đó) nhận được tin và bắn qua Socket cho User 2.
- **Kết quả:** Tất cả các server hoạt động như một thể thống nhất.

### E. Distributed Lock (Khoá vạn năng)
**Cơ chế:** Dùng lệnh `SET key value NX PX 30000` (Chỉ set nếu chưa tồn tại).
- **Kịch bản Flash Sale:**
  ```typescript
  const lock = await redis.set('lock:product_1', 'locked', 'NX', 'PX', 10000);
  if (lock) {
    // Chỉ 1 người duy nhất vào được đây tại một thời điểm
    // Thực hiện trừ tồn kho trong Database
    await redis.del('lock:product_1'); // Xong việc thì trả khoá
  } else {
    // Những người khác sẽ nhận được thông báo "Hệ thống đang bận"
  }
  ```

---

## 3. Quản lý và Giám sát Redis

Để xem Redis đang chứa gì, bạn có thể dùng các công cụ:
1. **Redis Insight:** Giao diện đồ họa (GUI) cực đẹp để soi dữ liệu.
2. **CLI:** Dùng lệnh `redis-cli monitor` để xem các lệnh đang chạy realtime.
3. **Lưu ý quan trọng:** Luôn đặt **TTL** cho mọi key để tránh làm đầy bộ nhớ RAM của server.

---

*Tài liệu này là kim chỉ nam để bạn nâng cấp tư duy từ một lập trình viên Code-chạy-được sang một Kiến trúc sư hệ thống (System Architect).*
