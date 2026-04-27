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
  const item = await prisma.reviewRequest.findFirst({
    where: {
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      guest: true,
    },
  });

  if (!item) {
    console.log(JSON.stringify({
      ok: false,
      reason: "No PENDING ReviewRequest found. Create and complete a reservation first.",
    }, null, 2));
    return;
  }

  const updated = await prisma.reviewRequest.update({
    where: {
      id: item.id,
    },
    data: {
      sendAt: new Date(),
      errorMessage: null,
    },
  });

  console.log(JSON.stringify({
    ok: true,
    id: updated.id,
    status: updated.status,
    sendAt: updated.sendAt,
    guestName: updated.guestName,
    guestPhone: item.guest?.phone ?? null,
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