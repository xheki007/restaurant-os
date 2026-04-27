// PATH: C:\restaurant-os\services\api\scripts\list-branches-with-layout.cjs

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
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      restaurantId: true,
      tenantId: true,
      _count: {
        select: {
          zones: true,
          tables: true,
        },
      },
    },
  });

  console.log(JSON.stringify(branches, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});