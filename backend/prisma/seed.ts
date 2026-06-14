import 'dotenv/config';
import { PrismaClient, UserRole, TransactionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.vn' },
    update: {},
    create: {
      email: 'admin@store.vn',
      password: adminPassword,
      name: 'Admin',
      phone: '0901234567',
      role: UserRole.ADMIN,
    },
  });

  // 2. Create warehouse manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@store.vn' },
    update: {},
    create: {
      email: 'manager@store.vn',
      password: managerPassword,
      name: 'Quản lý kho',
      phone: '0909876543',
      role: UserRole.WAREHOUSE_MANAGER,
    },
  });

  // 3. Create shipper users
  const shipperPassword = await bcrypt.hash('shipper123', 10);
  const shipperUser1 = await prisma.user.upsert({
    where: { email: 'shipper1@store.vn' },
    update: {},
    create: {
      email: 'shipper1@store.vn',
      password: shipperPassword,
      name: 'Nguyễn Văn Shipper',
      phone: '0911111111',
      role: UserRole.SHIPPER,
    },
  });

  const shipperUser2 = await prisma.user.upsert({
    where: { email: 'shipper2@store.vn' },
    update: {},
    create: {
      email: 'shipper2@store.vn',
      password: shipperPassword,
      name: 'Trần Thị Giao',
      phone: '0922222222',
      role: UserRole.SHIPPER,
    },
  });

  // 4. Create shippers
  await prisma.shipper.upsert({
    where: { userId: shipperUser1.id },
    update: {},
    create: { userId: shipperUser1.id, phone: '0911111111', vehicleType: 'xe máy' },
  });

  await prisma.shipper.upsert({
    where: { userId: shipperUser2.id },
    update: {},
    create: { userId: shipperUser2.id, phone: '0922222222', vehicleType: 'xe tải nhỏ' },
  });

  // 5. Create warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Kho Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      lat: 10.7731,
      lng: 106.7030,
    },
  });

  // 6. Create products
  const products = [
    { name: 'Nước suối 500ml', sku: 'NS-500', unit: 'thùng', price: 85000 },
    { name: 'Mì gói Hảo Hảo', sku: 'MG-HH', unit: 'thùng', price: 120000 },
    { name: 'Dầu ăn 1L', sku: 'DA-1L', unit: 'chai', price: 45000 },
    { name: 'Gạo ST25 5kg', sku: 'G-ST25', unit: 'bao', price: 150000 },
    { name: 'Sữa tươi TH 1L', sku: 'STH-1L', unit: 'hộp', price: 32000 },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // 7. Seed initial stock via transactions (proper way)
  const allProducts = await prisma.product.findMany();
  for (const product of allProducts) {
    const qty = 100;
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_productId: { warehouseId: warehouse.id, productId: product.id },
      },
      update: { quantity: qty },
      create: { warehouseId: warehouse.id, productId: product.id, quantity: qty },
    });

    await prisma.inventoryTransaction.create({
      data: {
        warehouseId: warehouse.id,
        productId: product.id,
        type: TransactionType.IMPORT,
        quantity: qty,
        balanceBefore: 0,
        balanceAfter: qty,
        reason: 'Nhập kho ban đầu (seed)',
        createdById: admin.id,
      },
    });
  }

  console.log('✅ Seed completed');
  console.log('   Admin: admin@store.vn / admin123');
  console.log('   Manager: manager@store.vn / manager123');
  console.log('   Shipper 1: shipper1@store.vn / shipper123');
  console.log('   Shipper 2: shipper2@store.vn / shipper123');
  console.log(`   Warehouse: ${warehouse.name}`);
  console.log(`   Products: ${allProducts.length} items, 100 each`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
