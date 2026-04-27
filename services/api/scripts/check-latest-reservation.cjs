const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        guest: true,
        assignedTable: true,
        assignedCombination: {
          include: {
            items: true,
          },
        },
      },
    });

    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});