// PATH: C:\restaurant-os\services\api\scripts\verify-security-events.cjs

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
  const logs = await prisma.securityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(JSON.stringify(logs, null, 2));

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});