// PATH: C:\restaurant-os\services\api\scripts\list-branch-tables.cjs

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
  const branchId = "cmnrwsh4q0003ocvl9azqxrr0";

  const tables = await prisma.restaurantTable.findMany({
    where: { branchId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      capacityMin: true,
      capacityMax: true,
      zoneId: true,
    },
  });

  console.log(JSON.stringify(tables, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});