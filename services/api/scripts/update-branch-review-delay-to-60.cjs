const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const branchId = process.env.BRANCH_ID;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.branchSettings.update({
    where: {
      branchId,
    },
    data: {
      reviewDelayMinutes: 60,
    },
  });

  console.log(JSON.stringify({
    branchId: updated.branchId,
    googleReviewLink: updated.googleReviewLink,
    reviewDelayMinutes: updated.reviewDelayMinutes,
  }, null, 2));
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