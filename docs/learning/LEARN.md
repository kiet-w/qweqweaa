# 🚀 LỘ TRÌNH HỌC NESTJS — TỪ CƠ BẢN ĐẾN ENTERPRISE

> Tất cả những gì một doanh nghiệp thực sự cần. Có tính ứng dụng cao, không học cho vui.

---

## PHẦN 0 — TRƯỚC KHI BẮT ĐẦU: Mindset đúng

Học NestJS không phải học framework. Học NestJS là học cách **tổ chức hệ thống backend chịu tải thực tế**.

NestJS chỉ là công cụ. Vấn đề thực sự là:
- Hệ thống của mày có 1 user hay 1 triệu user cùng lúc?
- Khi server bị quá tải thì mày xử lý thế nào?
- Khi database chết thì app mày còn sống không?
- Khi có bug security thì mày biết không? Biết khi nào?

Học theo thứ tự bên dưới. Đừng nhảy cóc.

---

## PHẦN 1 — NỀN TẢNG NESTJS (Tuần 1-2)

### Bài 1.1 — Hiểu tại sao NestJS tồn tại

Express.js cho mày tự do tuyệt đối → dễ sinh ra code lộn xộn khi team lớn.
NestJS áp đặt cấu trúc → Module, Controller, Service, Provider → cả team code giống nhau → dễ maintain.

**Cấu trúc cơ bản:**
```
src/
  app.module.ts       ← Root module, nơi kết nối tất cả
  main.ts             ← Điểm khởi động app
  users/
    users.module.ts   ← Module riêng cho feature users
    users.controller.ts
    users.service.ts
    users.entity.ts
    dto/
      create-user.dto.ts
```

**Nguyên tắc quan trọng:**
- Controller: chỉ nhận request, trả response. KHÔNG có business logic.
- Service: chứa toàn bộ business logic.
- Module: đóng gói một feature, expose những gì cần thiết ra ngoài.

### Bài 1.2 — Dependency Injection (DI) — Trái tim của NestJS

DI là cơ chế NestJS tự động tạo và inject các dependency vào nơi cần dùng.

```typescript
// Thay vì mày tự new:
const userService = new UserService(new UserRepository(...));

// NestJS làm hộ mày:
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // usersService đã được inject tự động
}
```

**Tại sao DI quan trọng ở doanh nghiệp:**
- Dễ test: có thể mock dependency
- Dễ swap: đổi implementation mà không sửa code nơi dùng
- Lifecycle được quản lý: singleton, request-scoped, transient

**Scope của Provider — quan trọng khi có nhiều request:**

- `DEFAULT` (Singleton): 1 instance dùng cho cả app → nhanh, dùng cho stateless service
- `REQUEST`: 1 instance per request → dùng khi cần data riêng của từng request (vd: user hiện tại)
- `TRANSIENT`: mỗi lần inject tạo instance mới → dùng ít, tốn memory

```typescript
@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

**Cảnh báo thực tế:** Dùng REQUEST scope quá nhiều → app chậm vì tạo object liên tục. Chỉ dùng khi thực sự cần.

### Bài 1.3 — Controllers, Services, DTOs, Validation

**DTO (Data Transfer Object)** — không phải chỉ là cái class đẹp, đây là lớp bảo vệ đầu tiên:

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;
}
```

Kết hợp với `ValidationPipe` global:
```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,        // Xóa field lạ không khai báo trong DTO
  forbidNonWhitelisted: true, // Throw error nếu có field lạ → bảo mật
  transform: true,        // Tự động chuyển type (string '123' → number 123)
}));
```

**Tại sao `whitelist: true` quan trọng:**
Nếu không có, user có thể gửi `{ role: 'admin' }` và nếu code của mày vô tình dùng spread operator, có thể bị leo thang quyền (privilege escalation).

---

## PHẦN 2 — DATABASE & ORM (Tuần 2-3)

### Bài 2.1 — TypeORM với PostgreSQL

**Thiết lập kết nối đúng cách cho production:**

```typescript
// database.module.ts
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    
    // Quan trọng cho production:
    synchronize: false,  // KHÔNG BAO GIỜ true trong production → mất data
    migrationsRun: true, // Tự chạy migration khi khởi động
    
    // Connection pool — cực kỳ quan trọng khi nhiều request:
    extra: {
      max: 20,          // Tối đa 20 connection đồng thời
      min: 2,           // Luôn giữ 2 connection sẵn sàng
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    
    logging: configService.get('NODE_ENV') === 'development',
    ssl: configService.get('NODE_ENV') === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  }),
  inject: [ConfigService],
})
```

### Bài 2.2 — Connection Pool — Hiểu để không chết server

**Vấn đề thực tế:**
- 1 request cần 1 database connection
- Nếu có 1000 request đồng thời mà không có pool → 1000 connection → database chết
- Connection pool giới hạn số connection tối đa, các request dư phải chờ

**Cách tính pool size:**
```
Pool size = (CPU cores * 2) + số disk spindles

Ví dụ: 4 CPU cores → pool size khoảng 9-10
```

**Triệu chứng pool exhaustion (hết pool):**
- Request timeout sau ~2-5 giây
- Log: "TimeoutError: ResourceRequest timed out"
- CPU database thấp nhưng query chậm

**Cách fix:**
1. Tăng pool size (nhưng có giới hạn của database)
2. Dùng PgBouncer (connection pooler ở tầng database)
3. Optimize query chậm để giải phóng connection nhanh hơn
4. Scale horizontal (thêm server)

### Bài 2.3 — Migrations (Bắt buộc phải biết)

```bash
# Tạo migration
npx typeorm migration:create src/migrations/CreateUsersTable

# Generate migration từ entity changes
npx typeorm migration:generate src/migrations/AddUserAvatarColumn -d src/data-source.ts

# Chạy migration
npx typeorm migration:run -d src/data-source.ts

# Rollback
npx typeorm migration:revert -d src/data-source.ts
```

**Quy tắc migration ở doanh nghiệp:**
- Migration phải backward compatible: thêm column nullable trước, rồi sau mới bỏ NOT NULL
- Không đổi tên column trực tiếp: tạo column mới → migrate data → xóa column cũ
- Migration phải chạy được nhiều lần mà không lỗi (idempotent)

---

## PHẦN 3 — AUTHENTICATION & AUTHORIZATION (Tuần 3-4)

### Bài 3.1 — JWT Authentication đúng cách

**Sai lầm phổ biến:** Chỉ dùng 1 loại token.

**Đúng:** Access Token + Refresh Token

```typescript
// auth.service.ts
async login(user: User) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  
  return {
    accessToken: this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '15m',  // Ngắn → nếu bị lộ thì thiệt hại ít
    }),
    refreshToken: this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',   // Dài hơn → lưu ở database
    }),
  };
}

async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.usersService.findById(userId);
  
  // QUAN TRỌNG: Refresh token phải được lưu hash trong DB
  // Để có thể revoke khi user logout hoặc bị đánh cắp
  const tokenMatches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
  if (!tokenMatches) throw new ForbiddenException();
  
  return this.login(user);
}

async logout(userId: string) {
  // Xóa refresh token khỏi DB → token cũ vô dụng
  await this.usersService.update(userId, { hashedRefreshToken: null });
}
```

**Tại sao Access Token ngắn (15 phút)?**
- JWT không thể revoke sau khi phát hành (stateless)
- Nếu bị đánh cắp, chỉ có hiệu lực 15 phút
- Refresh Token lưu DB → có thể revoke bất cứ lúc nào

### Bài 3.2 — Guard, Strategy, Decorator

```typescript
// Custom decorator để lấy user hiện tại:
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Dùng trong controller:
@Get('profile')
@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: User) {
  return user;
}

@Get('email')
@UseGuards(JwtAuthGuard)
getEmail(@CurrentUser('email') email: string) {
  return { email };
}
```

### Bài 3.3 — RBAC (Role-Based Access Control)

```typescript
// roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // Không yêu cầu role → cho qua

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Dùng:
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
remove(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

---

## PHẦN 4 — XỬ LÝ QUÁ TẢI & HIỆU NĂNG (Tuần 4-5) ⭐ PHẦN QUAN TRỌNG NHẤT

### Bài 4.1 — Rate Limiting (Chặn quá tải từ client)

**Scenario:** 1 user (hoặc bot) gửi 10,000 request/phút → server chết.

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 giây
    limit: 10,    // Tối đa 10 request
  },
  {
    name: 'medium',
    ttl: 60000,   // 1 phút
    limit: 100,
  },
  {
    name: 'long',
    ttl: 3600000, // 1 giờ
    limit: 1000,
  },
]),

// Global guard:
providers: [
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
],
```

**Rate limit thông minh hơn — theo user thay vì IP:**
```typescript
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Nếu đã đăng nhập → track theo userId (chính xác hơn)
    // Nếu chưa → track theo IP
    return req.user?.id ?? req.ip;
  }
}
```

**Rate limit cho endpoint nhạy cảm (login, OTP):**
```typescript
@Post('login')
@Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 lần/phút
async login(@Body() dto: LoginDto) { ... }
```

### Bài 4.2 — Caching với Redis

**Tại sao Redis, không phải in-memory:**
- In-memory cache mất khi restart
- Có nhiều instance (horizontal scale) → mỗi instance cache khác nhau → inconsistent
- Redis là centralized cache → tất cả instance đều dùng chung

```bash
npm install @nestjs/cache-manager cache-manager ioredis
```

```typescript
// cache.module.ts
CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    store: redisStore,
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    ttl: 60 * 5, // 5 phút default
  }),
  inject: [ConfigService],
}),
```

**Cache Pattern thực tế:**

```typescript
// Cache-aside pattern (phổ biến nhất):
@Injectable()
export class ProductsService {
  constructor(
    private readonly cache: Cache,
    private readonly productsRepo: ProductsRepository,
  ) {}

  async findById(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;
    
    // 1. Kiểm tra cache trước
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) return cached;
    
    // 2. Miss → query DB
    const product = await this.productsRepo.findOne(id);
    if (!product) throw new NotFoundException();
    
    // 3. Lưu vào cache
    await this.cache.set(cacheKey, product, 300); // 5 phút
    
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productsRepo.save({ id, ...dto });
    
    // Invalidate cache sau khi update
    await this.cache.del(`product:${id}`);
    
    return product;
  }
}
```

**Cache Stampede Problem — và cách giải quyết:**

Kịch bản: Cache expire → 1000 request cùng lúc vào DB để lấy cùng 1 data → DB chết

```typescript
// Giải pháp: Mutex lock
import { Mutex } from 'async-mutex';

private mutexes = new Map<string, Mutex>();

async findById(id: string): Promise<Product> {
  const cacheKey = `product:${id}`;
  const cached = await this.cache.get<Product>(cacheKey);
  if (cached) return cached;

  // Chỉ 1 request được phép query DB cho cùng 1 id
  if (!this.mutexes.has(id)) {
    this.mutexes.set(id, new Mutex());
  }
  
  const release = await this.mutexes.get(id).acquire();
  
  try {
    // Double-check sau khi acquire lock
    const cachedAfterLock = await this.cache.get<Product>(cacheKey);
    if (cachedAfterLock) return cachedAfterLock;

    const product = await this.productsRepo.findOne(id);
    await this.cache.set(cacheKey, product, 300);
    return product;
  } finally {
    release();
  }
}
```

### Bài 4.3 — Queue & Background Jobs (Xử lý tác vụ nặng)

**Vấn đề thực tế:**
- User đăng ký → phải gửi email xác nhận
- Nếu gửi email trong request → user chờ 2-3 giây → UX tệ
- Giải pháp: Push job vào queue → trả response ngay → worker xử lý background

```bash
npm install @nestjs/bull bull ioredis
```

```typescript
// email.processor.ts
@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process('send-welcome-email')
  async handleWelcomeEmail(job: Job<{ userId: string; email: string }>) {
    this.logger.log(`Sending welcome email to ${job.data.email}`);
    
    try {
      await this.emailService.sendWelcomeEmail(job.data.email);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error; // Bull sẽ tự retry
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
    // Gửi alert tới Slack, PagerDuty...
  }
}

// users.service.ts — push job vào queue
async register(dto: CreateUserDto) {
  const user = await this.usersRepo.save(dto);
  
  // Push job — không await → trả về ngay
  await this.emailQueue.add(
    'send-welcome-email',
    { userId: user.id, email: user.email },
    {
      attempts: 3,           // Retry 3 lần nếu fail
      backoff: {
        type: 'exponential', // Chờ 2s, 4s, 8s giữa các lần retry
        delay: 2000,
      },
      removeOnComplete: 100, // Giữ 100 job thành công gần nhất
      removeOnFail: 200,     // Giữ 200 job thất bại để debug
    },
  );
  
  return { message: 'Registration successful. Check your email.' };
}
```

**Các loại job phổ biến ở doanh nghiệp:**
- Gửi email/SMS/push notification
- Resize ảnh sau khi upload
- Generate report lớn
- Sync data với hệ thống bên ngoài
- Cleanup data cũ (scheduled job)

### Bài 4.4 — Xử lý khi server quá tải

**Graceful Degradation — App vẫn chạy khi 1 phần chết:**

```typescript
// Khi Redis chết → fallback về query DB trực tiếp (không crash app)
async findById(id: string): Promise<Product> {
  try {
    const cached = await this.cache.get<Product>(`product:${id}`);
    if (cached) return cached;
  } catch (error) {
    // Redis chết → bỏ qua, query thẳng DB
    this.logger.warn('Cache unavailable, falling back to DB');
  }
  
  return this.productsRepo.findOne(id);
}
```

**Circuit Breaker Pattern:**

Khi service bên ngoài (payment gateway, SMS...) liên tục fail → dừng gọi nó một thời gian, trả error ngay thay vì chờ timeout.

```bash
npm install opossum
```

```typescript
import * as CircuitBreaker from 'opossum';

@Injectable()
export class PaymentService {
  private breaker: CircuitBreaker;

  constructor() {
    this.breaker = new CircuitBreaker(this.callExternalPaymentAPI.bind(this), {
      timeout: 3000,         // Timeout sau 3s
      errorThresholdPercentage: 50, // 50% fail → mở circuit
      resetTimeout: 30000,   // Sau 30s thử lại
    });

    this.breaker.on('open', () => {
      this.logger.warn('Payment circuit OPEN — blocking requests');
    });
    this.breaker.on('halfOpen', () => {
      this.logger.log('Payment circuit HALF-OPEN — testing recovery');
    });
    this.breaker.on('close', () => {
      this.logger.log('Payment circuit CLOSED — service recovered');
    });
  }

  async processPayment(data: PaymentData) {
    try {
      return await this.breaker.fire(data);
    } catch (error) {
      if (this.breaker.opened) {
        throw new ServiceUnavailableException('Payment service temporarily unavailable');
      }
      throw error;
    }
  }
}
```

---

## PHẦN 5 — SCALE HỆ THỐNG (Tuần 5-6) ⭐

### Bài 5.1 — Horizontal Scaling & Load Balancing

**Vertical Scaling** (scale up): Nâng CPU/RAM của 1 server → có giới hạn vật lý, đắt
**Horizontal Scaling** (scale out): Thêm nhiều instance → không giới hạn, rẻ hơn

**NestJS với Horizontal Scaling:**

Để horizontal scale được, app phải **stateless**:
- Không lưu session trong memory (dùng Redis)
- Không lưu file upload local (dùng S3/CloudStorage)
- Không có shared mutable state giữa instances

```typescript
// SAI — lưu state trong memory:
@Injectable()
export class AppService {
  private loggedInUsers = new Set<string>(); // Mất khi restart, không sync giữa instances
}

// ĐÚNG — lưu state trong Redis:
@Injectable()
export class SessionService {
  async setUserOnline(userId: string) {
    await this.redis.setex(`online:${userId}`, 300, '1');
  }
  
  async isUserOnline(userId: string): Promise<boolean> {
    return !!(await this.redis.get(`online:${userId}`));
  }
}
```

### Bài 5.2 — Nginx Load Balancer

**nginx.conf cơ bản:**
```nginx
upstream nestjs_backend {
  least_conn;  # Gửi request đến server ít connection nhất
  
  server app1:3000 weight=1;
  server app2:3000 weight=1;
  server app3:3000 weight=1;
  
  keepalive 32; # Giữ 32 connection mở với mỗi server
}

server {
  listen 80;
  
  location /api {
    proxy_pass http://nestjs_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
    
    # Timeout settings
    proxy_connect_timeout 5s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }
}
```

**Các thuật toán load balancing:**
- `round_robin` (default): lần lượt từng server → đơn giản
- `least_conn`: gửi đến server ít connection nhất → tốt khi request có thời gian xử lý khác nhau
- `ip_hash`: cùng IP luôn vào cùng server → cần khi có sticky session
- `random`: random → cần ít nhất 2 server

### Bài 5.3 — Docker & Docker Compose cho Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run start:dev

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### Bài 5.4 — Health Checks (Bắt buộc cho production)

```bash
npm install @nestjs/terminus
```

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: MicroserviceHealthIndicator,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Check database
      () => this.db.pingCheck('database'),
      
      // Check Redis
      () => this.redis.pingCheck('redis', {
        transport: Transport.REDIS,
        options: { host: 'redis', port: 6379 },
      }),
      
      // Check external API
      () => this.http.pingCheck('payment-api', 'https://api.payment.com/health'),
      
      // Custom check
      () => this.checkDiskSpace(),
    ]);
  }

  private async checkDiskSpace() {
    // Check disk usage < 90%
    const freeSpacePercent = await this.getDiskFreePercent();
    if (freeSpacePercent < 10) {
      throw new Error(`Disk space critical: ${freeSpacePercent}% free`);
    }
    return { disk: { status: 'up', freePercent: freeSpacePercent } };
  }
}
```

Load balancer (Nginx, AWS ALB...) sẽ call `/health` mỗi 30 giây. Nếu fail → tự động remove instance đó khỏi pool.

---

## PHẦN 6 — OBSERVABILITY (Tuần 6-7)

### Bài 6.1 — Logging đúng cách

**Không dùng `console.log` trong production.**

```typescript
// logger.service.ts — Structured logging
@Injectable()
export class AppLogger extends ConsoleLogger {
  log(message: string, context?: string, metadata?: object) {
    // Output JSON → dễ query trên ELK, CloudWatch, Datadog
    process.stdout.write(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      context,
      message,
      ...metadata,
    }) + '\n');
  }
}

// Logging interceptor — log mọi request/response
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - start;
          this.logger.log({
            method, url,
            userId: user?.id,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration: `${duration}ms`,
          });
        },
        error: (error) => {
          const duration = Date.now() - start;
          this.logger.error({
            method, url,
            userId: user?.id,
            error: error.message,
            duration: `${duration}ms`,
          });
        },
      }),
    );
  }
}
```

### Bài 6.2 — Error Handling Tập Trung

```typescript
// all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
      code = (exceptionResponse as any).error || exception.constructor.name;
    }

    // Log 5xx errors (lỗi hệ thống, cần alert)
    if (status >= 500) {
      this.logger.error({
        message,
        stack: exception instanceof Error ? exception.stack : undefined,
        path: request.url,
        method: request.method,
        userId: (request as any).user?.id,
      });
      
      // Có thể gửi alert Slack, PagerDuty ở đây
    }

    response.status(status).json({
      statusCode: status,
      code,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
      // KHÔNG expose stack trace ra ngoài production
    });
  }
}
```

### Bài 6.3 — Metrics & Monitoring

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

```typescript
// Expose metrics endpoint cho Prometheus scrape
// Sau đó dùng Grafana để visualize

@Injectable()
export class MetricsService {
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private activeConnections: Gauge;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
    });
  }

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route }, duration / 1000);
  }
}
```

---

## PHẦN 7 — SECURITY (Tuần 7-8)

### Bài 7.1 — Security Headers

```bash
npm install helmet
```

```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS
app.enableCors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400, // Preflight cache 1 ngày
});
```

### Bài 7.2 — SQL Injection, XSS Prevention

**TypeORM tự chống SQL injection khi dùng đúng cách:**

```typescript
// SAI — raw query với user input:
const user = await this.userRepo.query(
  `SELECT * FROM users WHERE email = '${email}'`
);

// ĐÚNG — parameterized:
const user = await this.userRepo.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// TỐT NHẤT — dùng QueryBuilder:
const user = await this.userRepo
  .createQueryBuilder('user')
  .where('user.email = :email', { email })
  .getOne();
```

**Sanitize output để chống XSS:**
```bash
npm install dompurify jsdom
```

```typescript
// Nếu app trả về HTML content (vd: rich text editor)
import * as createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as any);

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  });
}
```

### Bài 7.3 — Secrets Management

```typescript
// KHÔNG BAO GIỜ hardcode secrets:
const apiKey = 'sk-abc123...'; // SAI

// Dùng ConfigModule + .env:
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        DB_HOST: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        REDIS_HOST: Joi.string().required(),
      }),
    }),
  ],
})
```

**Ở production dùng:**
- AWS Secrets Manager / Parameter Store
- HashiCorp Vault
- Kubernetes Secrets (encrypted at rest)

---

## PHẦN 8 — MICROSERVICES (Tuần 8-10)

### Bài 8.1 — Khi nào KHÔNG nên dùng Microservices

Trước khi học microservices, hiểu khi nào KHÔNG nên dùng:
- Team < 10 người → monolith tốt hơn
- App còn đang thay đổi nhiều → microservices cứng nhắc hơn
- Chưa có vấn đề về scale → premature optimization

**Quy trình đúng:** Monolith → Modular Monolith → Microservices (khi cần)

### Bài 8.2 — NestJS Microservices với Redis Transport

```typescript
// main.ts — Microservice
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.REDIS,
  options: {
    host: 'redis',
    port: 6379,
  },
});

// Handler trong microservice:
@MessagePattern('users.findById')
async findById(@Payload() id: string): Promise<User> {
  return this.usersService.findById(id);
}

@EventPattern('order.created')
async handleOrderCreated(@Payload() data: OrderCreatedEvent) {
  // Xử lý event — không cần trả về gì
  await this.notificationService.notifyUser(data.userId, 'Order placed!');
}

// Gọi từ service khác:
const user = await firstValueFrom(
  this.client.send<User>('users.findById', userId)
);

// Emit event (fire and forget):
this.client.emit('order.created', { orderId, userId });
```

### Bài 8.3 — Event-Driven Architecture với RabbitMQ/Kafka

**Khi nào dùng Message Broker (RabbitMQ/Kafka) thay vì Redis:**
- Cần guarantee delivery (message không được mất kể cả khi server restart)
- Cần message ordering
- Cần replay events
- Throughput rất cao (Kafka: millions/second)

```typescript
// Với RabbitMQ:
const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://rabbitmq:5672'],
    queue: 'notifications_queue',
    queueOptions: {
      durable: true,    // Queue survive restart
    },
    noAck: false,       // Manual ack → đảm bảo message được xử lý
  },
});
```

---

## PHẦN 9 — CI/CD & DEPLOYMENT (Tuần 9-10)

### Bài 9.1 — Dockerfile tối ưu

```dockerfile
# Multi-stage build — image production nhỏ hơn
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # Chỉ install production deps
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

# Chạy với user không phải root — bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser

EXPOSE 3000

# Graceful shutdown
STOPSIGNAL SIGTERM

CMD ["node", "dist/main.js"]
```

### Bài 9.2 — Graceful Shutdown (Bắt buộc)

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Bắt signal shutdown
  app.enableShutdownHooks();
  
  await app.listen(3000);
  
  // Xử lý SIGTERM (Docker/Kubernetes gửi khi stop container)
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, starting graceful shutdown');
    
    // Dừng nhận request mới
    await app.close();
    
    // Đợi request đang xử lý hoàn thành (tối đa 30s)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    process.exit(0);
  });
}
```

**Tại sao Graceful Shutdown quan trọng:**
- Khi deploy mới → Kubernetes stop pod cũ → gửi SIGTERM
- Nếu không xử lý → request đang xử lý bị cắt ngang → user thấy lỗi
- Graceful shutdown → hoàn thành request hiện tại → mới dừng

### Bài 9.3 — GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build & Push Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          docker push registry.example.com/myapp:${{ github.sha }}
      
      - name: Deploy (zero-downtime rolling update)
        run: |
          # Kubernetes rolling update
          kubectl set image deployment/nestjs-app \
            nestjs=registry.example.com/myapp:${{ github.sha }}
          kubectl rollout status deployment/nestjs-app
```

---

## PHẦN 10 — ADVANCED PATTERNS (Tuần 10-12)

### Bài 10.1 — CQRS Pattern

Tách biệt Command (write) và Query (read):

```typescript
// Command — thay đổi data
export class CreateOrderCommand {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItem[],
  ) {}
}

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  async execute(command: CreateOrderCommand): Promise<Order> {
    // Business logic + validation
    // Lưu vào write DB
    const order = await this.orderRepo.save(...);
    
    // Publish event
    await this.eventBus.publish(new OrderCreatedEvent(order.id));
    
    return order;
  }
}

// Query — chỉ đọc, không thay đổi data
export class GetUserOrdersQuery {
  constructor(public readonly userId: string) {}
}

@QueryHandler(GetUserOrdersQuery)
export class GetUserOrdersHandler implements IQueryHandler<GetUserOrdersQuery> {
  async execute(query: GetUserOrdersQuery): Promise<Order[]> {
    // Có thể đọc từ read replica, Elasticsearch, cache...
    return this.orderReadRepo.findByUserId(query.userId);
  }
}
```

**Lợi ích CQRS:**
- Read và Write có thể scale độc lập
- Read side có thể dùng DB khác (Elasticsearch cho search)
- Dễ audit (mọi thay đổi đều là command)

### Bài 10.2 — Database Read Replica

```typescript
// Cấu hình 2 connection: write (master) và read (replica)
TypeOrmModule.forRoot({
  ...
  replication: {
    master: {
      host: process.env.DB_MASTER_HOST,
      port: 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    slaves: [
      {
        host: process.env.DB_REPLICA_1_HOST,
        port: 5432,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      },
    ],
  },
})
```

TypeORM tự động route SELECT → replica, INSERT/UPDATE/DELETE → master.

### Bài 10.3 — WebSocket với Scaling

```typescript
// gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // QUAN TRỌNG: Khi có nhiều server instance,
  // user A ở server 1, user B ở server 2 → không nhận được message của nhau
  // Giải pháp: Redis Adapter
}

// main.ts — Redis adapter cho WebSocket
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://redis:6379' });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);

const ioAdapter = new RedisIoAdapter(app);
await ioAdapter.connectToRedis();
app.useWebSocketAdapter(ioAdapter);
```

---

## CHECKLIST TRƯỚC KHI ĐƯA LÊN PRODUCTION

```
SECURITY
[ ] Tất cả secrets trong environment variables, không hardcode
[ ] Validation pipe global với whitelist: true
[ ] Rate limiting trên tất cả endpoint
[ ] Helmet headers
[ ] CORS configured đúng origin
[ ] JWT secret đủ mạnh (>= 32 chars)
[ ] SQL injection: dùng parameterized queries / ORM
[ ] HTTPS only (HTTP redirect to HTTPS)
[ ] Không expose stack trace ra ngoài

DATABASE
[ ] synchronize: false trong production
[ ] Connection pool configured
[ ] Database credentials khác với dev
[ ] Backup automated
[ ] Migrations tested trên staging trước

PERFORMANCE
[ ] Caching cho data thay đổi ít
[ ] Indexes trên các column thường query
[ ] N+1 query problem đã fix (dùng eager loading / dataloader)
[ ] Background jobs cho tác vụ nặng

RELIABILITY
[ ] Health check endpoint
[ ] Graceful shutdown
[ ] Error monitoring (Sentry...)
[ ] Log có đủ thông tin để debug
[ ] Retry logic cho external calls
[ ] Circuit breaker cho external services

SCALABILITY
[ ] App stateless (không lưu state in-memory)
[ ] Session/cache trong Redis
[ ] File upload lên cloud storage (không local disk)

DEPLOYMENT
[ ] Zero-downtime deployment
[ ] Rollback plan
[ ] Staging environment giống production
[ ] Load test trước khi deploy
```

---

## THỨ TỰ HỌC ĐỀ XUẤT

```
Tuần 1-2:   Phần 1 + 2 (Core NestJS + Database)
Tuần 3-4:   Phần 3 + 4.1-4.2 (Auth + Rate Limit + Cache)
Tuần 5:     Phần 4.3-4.4 + 5 (Queue + Scale)
Tuần 6-7:   Phần 6 + 7 (Observability + Security)
Tuần 8-9:   Phần 8 (Microservices — chỉ khi cần)
Tuần 10:    Phần 9 + 10 (CI/CD + Advanced Patterns)
```

**Gợi ý project thực hành theo độ khó:**
1. REST API + Auth + CRUD (tuần 1-4)
2. Thêm caching + rate limiting + queue (tuần 5)
3. Containerize + deploy lên VPS với Nginx (tuần 6-7)
4. Thêm monitoring + alerting (tuần 8)
5. Horizontal scale với Docker Swarm hoặc Kubernetes (tuần 9-10)
```