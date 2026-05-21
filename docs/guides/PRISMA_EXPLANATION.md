# Giải Thích Chi Tiết Cấu Trúc Prisma & Supabase trong NestJS

Tài liệu này giải thích cặn kẽ từng thành phần liên quan đến Prisma trong dự án NestJS của chúng ta, lý do tại sao chúng tồn tại, và luồng hoạt động (flow) từ khi truy vấn đến khi dữ liệu được trả về.

---

## 1. Tại sao lại có thư mục `dist/**`?

### `dist` là gì?
`dist` là viết tắt của **Distribution** (phân phối). NestJS được viết bằng **TypeScript** (`.ts`), một ngôn ngữ có hỗ trợ kiểm tra kiểu dữ liệu (type-checking) rất mạnh mẽ giúp lập trình viên tránh lỗi. 

Tuy nhiên, môi trường chạy ứng dụng Node.js **không thể hiểu được TypeScript**. Nó chỉ chạy được **JavaScript** thuần.

### Tại sao lại cần nó?
Mỗi khi bạn chạy ứng dụng (ví dụ: `npm run start:dev` hoặc quá trình build `npm run build`), NestJS sẽ sử dụng một bộ biên dịch (compiler) để quét toàn bộ file `.ts` trong thư mục `src/`, dịch chúng sang `.js` và thả vào thư mục `dist/`.

**Kết luận:** Thư mục `dist/` chứa mã nguồn thực tế đang chạy trên server. Bạn **không bao giờ cần phải mở thư mục này ra để sửa code**, mọi chỉnh sửa phải được thực hiện ở thư mục `src/`, sau đó hệ thống sẽ tự động cập nhật lại thư mục `dist/`.

---

## 2. Tại sao Prisma lại sinh ra nhiều code như thế (`generated/prisma/**`)?

Trong các hệ thống ngày xưa (như TypeORM hay Sequelize), bạn phải tự tay viết các "kiểu dữ liệu" (types) cho từng bảng. Việc này dễ dẫn đến sai sót.

Prisma tiếp cận theo hướng **"Tự động sinh code" (Auto-generated)**:
- Bạn chỉ cần định nghĩa các bảng rất ngắn gọn trong file `prisma/schema.prisma`.
- Khi chạy lệnh `npx prisma generate`, Prisma sẽ đọc file schema đó và tự động tạo ra một thư viện TypeScript siêu to khổng lồ nằm trong thư mục `generated/prisma/client` (trong dự án của chúng ta, nó được cấu hình sinh ra ở đây thay vì mặc định nằm trong `node_modules`).

### Tại sao lại nhiều code?
Trong đống code tự sinh này chứa:
1. **Types/Interfaces:** Mọi cột trong bảng Supabase của bạn đều được định nghĩa kiểu dữ liệu chính xác (ví dụ: `email` là chuỗi, `id` là số).
2. **Query Engine:** Các hàm như `.findMany()`, `.create()`, `.update()` đã được tùy biến riêng cho database của bạn. 
3. **Lợi ích:** Nhờ đống code khổng lồ này, khi bạn gõ code trong VSCode, nó sẽ gợi ý từng tên cột và báo lỗi ngay lập tức bằng vạch đỏ nếu bạn truy vấn sai một chữ cái. Bạn không cần phải đọc hay hiểu đống code trong này, cứ để Prisma lo!

---

## 3. Giải thích chi tiết `src/prisma/prisma.service.ts`

File này đóng vai trò là "Nhân viên trực tổng đài" - nó chịu trách nhiệm kết nối ứng dụng NestJS của bạn tới Supabase.

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable() // (1) Đánh dấu class này có thể được inject (bơm) vào các class khác
export class PrismaService extends PrismaClient implements OnModuleInit {
  // (2) Kế thừa PrismaClient: Service này SỞ HỮU tất cả các hàm truy vấn (.findMany, .create...) 
  // từ đống code tự sinh của Prisma.

  constructor() {
    // (3) Khởi tạo kết nối tới Supabase
    // Lấy chuỗi kết nối từ file .env. Pool là một "hồ chứa" các kết nối để dùng lại.
    // Việc này giúp ứng dụng không phải tạo kết nối mới mỗi khi có 1 request gửi tới, 
    // tăng tốc độ cực kỳ đáng kể (Connection Pooling).
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // (4) Adapter PostgreSQL: Báo cho Prisma biết chúng ta đang dùng thư viện 'pg' 
    // để giao tiếp với PostgreSQL (Supabase).
    const adapter = new PrismaPg(pool);
    
    // (5) Gọi hàm khởi tạo của class cha (PrismaClient) và truyền cấu hình vào.
    super({ adapter });
  }

  // (6) Hàm này thuộc về Life-cycle (vòng đời) của NestJS
  async onModuleInit() {
    // Ngay sau khi ứng dụng NestJS vừa khởi động xong, 
    // nó sẽ tự động kích hoạt hàm $connect() để mở đường truyền tới Supabase ngay lập tức.
    // Tránh tình trạng request đầu tiên bị chậm do phải chờ mở kết nối.
    await this.$connect();
  }
}
```

---

## 4. Giải thích chi tiết `src/prisma/prisma.module.ts`

File này đóng vai trò là "Trạm phát sóng" để phân phát kết nối Database ra toàn bộ ứng dụng.

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // (1) SIÊU QUAN TRỌNG: Biến Module này thành "Của chung" (Toàn cục).
@Module({
  providers: [PrismaService], // (2) Đăng ký PrismaService để nó được khởi tạo.
  exports: [PrismaService],   // (3) Cho phép các Module khác mang PrismaService ra ngoài dùng.
})
export class PrismaModule {}
```

**Tại sao lại cần `@Global()`?**
Nếu không có chữ `@Global()`, khi bạn tạo `UserModule`, bạn sẽ phải `imports: [PrismaModule]` vào. Tạo `ProductModule` lại phải `imports: [PrismaModule]`. Rất dài dòng và lặp lại.
Có `@Global()`, `PrismaModule` trở thành vô hình và bao trùm toàn bộ ứng dụng. Bạn chỉ việc mở `UserService` lên và dùng luôn `PrismaService` mà không cần xin phép ai.

---

## 5. Flow (Luồng hoạt động) từ Prisma kết nối tới Backend và Supabase

Dưới đây là sơ đồ luồng dữ liệu khi một Request (Yêu cầu) từ người dùng bay vào hệ thống của bạn:

```text
[ Người Dùng (Client/Browser) ]
         │
         ▼ (1) HTTP Request (vd: GET /users)
         │
[ NestJS Controllers ] - Nhận Request, kiểm tra thông tin đầu vào.
         │
         ▼ (2) Gọi Service tương ứng (vd: UserService.getAllUsers())
         │
[ NestJS Services ] - Chứa logic xử lý, tính toán.
         │
         ▼ (3) Gọi Prisma (vd: this.prisma.user.findMany())
         │
[ PrismaService ] - Trình biên dịch câu lệnh
         │
         ▼ (4) Dịch lệnh TypeScript (findMany) thành câu SQL thuần (SELECT * FROM "User")
         │
[ Prisma PostgreSQL Adapter + pg Pool ] - Quản lý đường truyền mạng
         │
         ▼ (5) Gửi câu SQL qua Internet qua cổng 6543 (Connection Pooling của Supabase)
         │
[ Supabase (PostgreSQL Database) ] - Nhận lệnh SQL
         │
         ▼ (6) Lấy dữ liệu từ ổ cứng Database
         │
[ Supabase ] -- Trả về dữ liệu gốc (Rows) --> [ PrismaService ]
         │
         ▼ (7) Prisma chuyển dữ liệu từ SQL thành Object TypeScript
         │
[ NestJS Services ] -- Trả về mảng Object --> [ NestJS Controllers ]
         │
         ▼ (8) Trả về JSON
         │
[ Người Dùng (Client/Browser) ] - Nhận được danh sách User
```

**Tóm lược ngắn gọn Flow:**
1. Code BE (NestJS) gọi hàm thao tác DB thông qua Prisma.
2. Prisma sử dụng Engine để chuyển hàm đó thành mã SQL.
3. Chuyển mã SQL qua kết nối mạng PostgreSQL Adapter (`pg` Pool).
4. Máy chủ Database Supabase nhận lệnh và thực thi tìm kiếm.
5. Supabase trả dữ liệu thô (SQL result) về.
6. Prisma "gói" lại nó thành Object JavaScript/TypeScript để BE của bạn sử dụng.
