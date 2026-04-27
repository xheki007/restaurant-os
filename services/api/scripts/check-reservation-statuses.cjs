const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.reservation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 15,
    include: {
      guest: true,
      assignedTable: true,
      assignedCombination: true,
    },
  });

  for (const r of rows) {
    console.log(JSON.stringify({
      id: r.id,
      status: r.status,
      guestName: r.guest?.fullName,
      guestEmail: r.guest?.email,
      tableName: r.assignedTable?.name ?? null,
      combinationName: r.assignedCombination?.name ?? null,
      confirmationCode: r.confirmationCode,
      seatedAt: r.seatedAt,
      completedAt: r.completedAt,
      updatedAt: r.updatedAt,
    }));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });