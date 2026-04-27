require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.reviewRequest.updateMany({
    where: {
      status: "PENDING",
    },
    data: {
      sendAt: new Date(Date.now() - 5 * 60000),
    },
  });

  console.log("UPDATED");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });