const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const branches = await prisma.branch.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      restaurant: true,
      settings: true,
    },
  });

  console.log(JSON.stringify(branches.map((branch) => ({
    tenantId: branch.tenantId,
    branchId: branch.id,
    restaurantName: branch.restaurant?.name,
    branchName: branch.name,
    branchCode: branch.code,
    googleReviewLink: branch.settings?.googleReviewLink ?? null,
    reviewDelayMinutes: branch.settings?.reviewDelayMinutes ?? null,
  })), null, 2));
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