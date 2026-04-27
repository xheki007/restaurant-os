const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const branchId = process.env.BRANCH_ID;
const googleReviewLink = process.env.GOOGLE_REVIEW_LINK_VALUE;
const reviewDelayMinutes = Number(process.env.REVIEW_DELAY_MINUTES || 60);

if (!branchId) {
  throw new Error("BRANCH_ID missing");
}

if (!googleReviewLink) {
  throw new Error("GOOGLE_REVIEW_LINK_VALUE missing");
}

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
      googleReviewLink,
      reviewDelayMinutes,
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