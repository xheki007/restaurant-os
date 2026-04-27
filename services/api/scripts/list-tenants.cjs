// PATH: C:\restaurant-os\services\api\scripts\list-tenants.cjs

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
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  console.log(JSON.stringify(tenants, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});