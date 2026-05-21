# Giải Thích Chi Tiết - Module Redis (`src/redis`)

Redis là một kho chứa dữ liệu nằm thẳng trên RAM (bộ nhớ tạm của máy tính). Truy xuất dữ liệu từ RAM nhanh hơn gấp hàng nghìn lần so với việc đọc từ ổ cứng (Database/PostgreSQL). Ở đây, ta dùng Redis làm **Cache** (Bộ nhớ đệm).

## 1. `redis.module.ts`

Tương tự như Prisma, `RedisModule` cũng được gắn chữ `@Global()` để trở thành đồ dùng chung cho cả công ty. Module này cung cấp `RedisService` cho toàn bộ ứng dụng.

## 2. `redis.service.ts` (Dịch Vụ Tối Ưu Tốc Độ)

Dịch vụ này được thiết kế để giấu đi sự phức tạp của việc thao tác với Cache, sử dụng `@nestjs/cache-manager`.

### Các phương thức chi tiết:

#### 1. `get(key: string)`
Lấy dữ liệu từ Cache dựa trên khóa (key).
- **Tham số:** `key` (chuỗi) - Tên định danh của dữ liệu cần lấy.
- **Trả về:** `Promise<any>` - Dữ liệu được lưu trữ hoặc `undefined` nếu không tìm thấy.

#### 2. `set(key: string, value: any, ttl: number = 30000)`
Lưu dữ liệu vào Cache.
- **Tham số:**
  - `key` (chuỗi): Tên định danh để lưu dữ liệu.
  - `value` (bất kỳ): Dữ liệu cần lưu.
  - `ttl` (số - mặc định 30000ms): Thời gian sống của dữ liệu trong cache (Time-To-Live) tính bằng mili giây.
- **Trả về:** `Promise<void>`

#### 3. `del(key: string)`
Xóa một mục dữ liệu khỏi Cache.
- **Tham số:** `key` (chuỗi) - Khóa của dữ liệu cần xóa.
- **Trả về:** `Promise<void>`

#### 4. `reset()`
Xóa sạch toàn bộ dữ liệu trong Cache. Hàm này hỗ trợ cả hai phương thức `clear()` và `reset()` tùy thuộc vào phiên bản/driver của `cache-manager`.
- **Trả về:** `Promise<void>`

#### 5. `getOrSet(key: string, fetchFunction: () => Promise<any>, ttl: number = 30000)`
Đây là hàm quan trọng nhất, hoạt động theo tư duy "Cache Aside Pattern".

- **Tham số:**
  - `key` (chuỗi): Khóa để kiểm tra trong cache.
  - `fetchFunction` (Hàm): Hàm sẽ được gọi để lấy dữ liệu mới từ Database nếu cache trống.
  - `ttl` (số - mặc định 30000ms): Thời gian lưu trữ nếu dữ liệu được lấy mới.
- **Trả về:** `Promise<any>` - Dữ liệu từ cache hoặc dữ liệu mới từ Database.

**Luồng hoạt động:**
1. **Bước 1 (Kiểm tra):** Mở "tủ lạnh" (Redis) xem có dữ liệu với `key` đó không.
2. **Bước 2 (Trả về nếu có):** Nếu thấy dữ liệu, lấy ra trả về ngay lập tức (Cực nhanh!).
3. **Bước 3 (Lấy mới nếu thiếu):** Nếu tủ lạnh trống, thực hiện chạy `fetchFunction` (thường là xuống Database PostgreSQL để truy vấn).
4. **Bước 4 (Cập nhật cache):** Sau khi có dữ liệu mới, lưu nó vào Redis với thời gian `ttl` để lần sau không cần xuống Database nữa.

```typescript
// Ví dụ thực tế trong code:
const products = await this.redisService.getOrSet(
  'all_products_cache_key',
  () => this.prisma.product.findMany(),
  60000 // Lưu trong 1 phút
);
```

Nhờ thiết kế này, các module khác có thể áp dụng Cache một cách cực kỳ gọn gàng mà không cần viết đi viết lại logic kiểm tra và lưu trữ.
