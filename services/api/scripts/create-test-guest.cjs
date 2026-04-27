require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const guest = await prisma.guest.create({
    data: {
      tenantId: "cmnptyeth0001hgvuq0yst1tz",
      firstName: "John",
      lastName: "Doe",
      fullName: "John Doe",
      phone: "+38344123456",
      email: "john.doe@example.com"
    },
  });

  console.log(JSON.stringify(guest, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });