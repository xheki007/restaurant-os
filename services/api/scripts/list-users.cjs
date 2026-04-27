require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      tenantId: true,
      status: true
    }
  });

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  console.log("TENANTS:");
  console.dir(tenants, { depth: null });

  console.log("USERS:");
  console.dir(users, { depth: null });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });