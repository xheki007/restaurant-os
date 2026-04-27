// PATH: C:\restaurant-os\services\api\scripts\verify-auth-seed.cjs

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

(async () => {
  const permissionCount = await prisma.permission.count();
  const roleCount = await prisma.role.count();
  const rolePermissionCount = await prisma.rolePermission.count();

  console.log({ permissionCount, roleCount, rolePermissionCount });

  const roles = await prisma.role.findMany({
    take: 20,
    orderBy: { createdAt: "asc" },
    select: {
      tenantId: true,
      code: true,
      name: true,
      isSystem: true,
    },
  });

  console.log(JSON.stringify(roles, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});