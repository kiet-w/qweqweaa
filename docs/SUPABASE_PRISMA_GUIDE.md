# Hướng dẫn Tích hợp Supabase & Prisma 7 (NestJS)

Tài liệu này tóm tắt các thay đổi và hướng dẫn cách sử dụng hệ thống Database mới trong dự án của bạn.

## 1. Các thành phần đã cài đặt

- **Prisma 7**: Phiên bản mới nhất, sử dụng engine TypeScript (WASM) giúp khởi động nhanh và nhẹ hơn.
- **PostgreSQL Adapter**: Sử dụng `@prisma/adapter-pg` để tối ưu kết nối với Supabase.
- **NestJS Prisma Module**: Một module toàn cục giúp bạn dễ dàng truy cập Database ở bất cứ đâu.

## 2. Cấu trúc File quan trọng

- `prisma.config.ts`: Cấu hình cho Prisma CLI (Migrations). Sử dụng `DIRECT_URL`.
- `prisma/schema.prisma`: Nơi định nghĩa các models (bảng) cơ sở dữ liệu.
- `src/prisma/`: Chứa `PrismaService` và `PrismaModule` của NestJS.
- `.env`: Chứa các biến môi trường để kết nối đến Supabase.

## 3. Cấu hình Supabase

Bạn cần lấy thông tin từ Supabase Dashboard (Project Settings > Database) và cập nhật vào file `.env`:

```env
# 1. Connection Pooling (Port 6543) - Dùng cho ứng dụng chạy runtime
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. Direct Connection (Port 5432) - Dùng cho migrations (CLI)
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

## 4. Quy trình phát triển (Workflow)

Mỗi khi bạn muốn thay đổi cấu trúc database:

1.  **Định nghĩa Model**: Thêm hoặc sửa model trong `prisma/schema.prisma`.
    ```prisma
    model User {
      id    Int     @id @default(autoincrement())
      email String  @unique
      name  String?
    }
    ```
2.  **Tạo Migration**: Chạy lệnh này để cập nhật Supabase:
    ```bash
    npx prisma migrate dev --name init_users
    ```
3.  **Generate Client**: Cập nhật TypeScript types cho Prisma Client:
    ```bash
    npx prisma generate
    ```

## 5. Cách sử dụng trong Code

Vì `PrismaModule` là `@Global()`, bạn chỉ cần inject `PrismaService` vào bất kỳ service nào:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getAllUsers() {
    return this.prisma.user.findMany();
  }
}
```

## 6. Lưu ý về Prisma 7

- Prisma 7 yêu cầu sử dụng `prisma.config.ts`. Đừng cố gắng đưa `url` trực tiếp vào `schema.prisma` vì nó sẽ gây lỗi validation.
- Client được generate vào thư mục `./generated/prisma` để tối ưu hóa việc phân tách giữa logic ứng dụng và mã được generate tự động.
