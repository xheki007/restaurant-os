require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.reviewRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log(JSON.stringify(rows, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });