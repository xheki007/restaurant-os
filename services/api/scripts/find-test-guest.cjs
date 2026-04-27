require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const guests = await prisma.guest.findMany({
    where: {
      tenantId: "cmnptyeth0001hgvuq0yst1tz",
      fullName: "John Doe",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(JSON.stringify(guests, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });