import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MapboxService } from './../src/mapbox/mapbox.service';

describe('Logistics System Integration (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let orderId1: number;
  let orderId2: number;

  const mockMapboxService = {
    geocode: jest.fn().mockResolvedValue({
      placeName: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      lng: 106.703,
      lat: 10.7731,
    }),
    optimizeRoute: jest.fn().mockResolvedValue({
      waypoints: [
        { waypointIndex: 0, tripsIndex: 0, name: 'Warehouse' },
        { waypointIndex: 1, tripsIndex: 1, name: 'Order 1' },
        { waypointIndex: 2, tripsIndex: 2, name: 'Order 2' },
      ],
      totalDistanceM: 1500,
      totalDurationS: 400,
      geometry: 'mocked_polyline',
    }),
    getDirections: jest.fn().mockResolvedValue({
      distanceM: 1200,
      durationS: 350,
      geometry: 'mocked_polyline',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MapboxService)
      .useValue(mockMapboxService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Login with admin credentials (POST /api/auth/login)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@store.vn',
        password: 'admin123',
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body).toHaveProperty('refreshToken');
    const body = response.body as { accessToken: string };
    adminToken = body.accessToken;
  });

  it('2. Retrieve warehouse stock (GET /api/inventory/warehouse/1)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory/warehouse/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const body = response.body as Record<string, unknown>[];
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('warehouseId', 1);
    expect(body[0]).toHaveProperty('quantity');
  });

  it('3. Import stock (POST /api/inventory/import)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/inventory/import')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        warehouseId: 1,
        productId: 1,
        quantity: 50,
        reason: 'E2E Import Test',
      })
      .expect(201);

    expect(response.body).toHaveProperty('transaction');
    const body = response.body as {
      transaction: { id: number; quantity: number };
    };
    expect(body.transaction).toHaveProperty('id');
    expect(body.transaction).toHaveProperty('quantity', 50);
  });

  it('4. Retrieve transaction log (GET /api/inventory/transactions)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/inventory/transactions')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ warehouseId: 1 })
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const body = response.body as Record<string, unknown>[];
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty('warehouseId', 1);
  });

  it('5. Create delivery order 1 (POST /api/delivery-orders)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/delivery-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientName: 'Customer Test A',
        recipientPhone: '0987654321',
        address: '456 Lê Lợi, Quận 1, TP.HCM',
        warehouseId: 1,
        items: [
          {
            productId: 1,
            quantity: 5,
          },
        ],
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    const body = response.body as { id: number };
    orderId1 = body.id;
  });

  it('6. Create delivery order 2 (POST /api/delivery-orders)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/delivery-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recipientName: 'Customer Test B',
        recipientPhone: '0912345678',
        address: '789 Nguyễn Huệ, Quận 1, TP.HCM',
        warehouseId: 1,
        items: [
          {
            productId: 1,
            quantity: 10,
          },
        ],
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    const body = response.body as { id: number };
    orderId2 = body.id;
  });

  it('7. Create delivery batch (POST /api/delivery-batches)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/delivery-batches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        shipperId: 1,
        orderIds: [orderId1, orderId2],
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('shipperId', 1);
  });

  it('8. Retrieve admin summary (GET /api/admin/dashboard/summary)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('orders');
    const body = response.body as {
      orders: { total: number };
      batches: { total: number };
    };
    expect(body.orders).toHaveProperty('total');
    expect(response.body).toHaveProperty('batches');
    expect(body.batches).toHaveProperty('total');
  });

  it('9. Retrieve admin inventory report (GET /api/admin/reports/inventory/1)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/reports/inventory/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
