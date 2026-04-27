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
  const items = await prisma.reviewRequest.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      guest: true,
      reservation: true,
      branch: {
        include: {
          restaurant: true,
          settings: true,
        },
      },
    },
  });

  console.log(JSON.stringify(items.map((item) => ({
    id: item.id,
    status: item.status,
    guestName: item.guestName,
    guestEmail: item.guestEmail,
    guestPhone: item.guest?.phone ?? null,
    restaurantName: item.branch?.restaurant?.name ?? null,
    googleReviewLink: item.branch?.settings?.googleReviewLink ?? null,
    sendAt: item.sendAt,
    sentAt: item.sentAt,
    errorMessage: item.errorMessage,
    reservationId: item.reservationId,
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