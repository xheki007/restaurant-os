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
  const reservations = await prisma.reservation.findMany({
    where: {
      status: {
        in: ["PENDING", "CONFIRMED", "SEATED"],
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: {
      id: true,
      tenantId: true,
      branchId: true,
      status: true,
      source: true,
      partySize: true,
      startAt: true,
      endAt: true,
      assignedTableId: true,
      assignedCombinationId: true,
      assignedTable: {
        select: {
          id: true,
          code: true,
          name: true,
          capacityMin: true,
          capacityMax: true,
          zoneId: true,
        },
      },
      assignedCombination: {
        select: {
          id: true,
          name: true,
          capacityMin: true,
          capacityMax: true,
          items: {
            select: {
              table: {
                select: {
                  id: true,
                  code: true,
                  capacityMin: true,
                  capacityMax: true,
                },
              },
            },
          },
        },
      },
      guest: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  });

  console.log(JSON.stringify(reservations, null, 2));
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