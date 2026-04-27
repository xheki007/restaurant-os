require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DEBUG_DB_ERROR:");
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
  });

  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log("TENANTS:");
  console.dir(tenants, { depth: null });

  console.log("BRANCHES:");
  console.dir(branches, { depth: null });
}

main()
  .catch((error) => {
    console.error("DEBUG_DB_ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });