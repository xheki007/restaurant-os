require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("VERIFY_SECURITY_EVENTS_ERROR:");
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const events = await prisma.securityEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.dir(events, { depth: null });
}

main()
  .catch((error) => {
    console.error("VERIFY_SECURITY_EVENTS_ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });