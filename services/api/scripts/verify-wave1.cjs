require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const plans = await prisma.subscriptionPlan.findMany();
  const tenants = await prisma.tenant.findMany();
  const restaurants = await prisma.restaurant.findMany();
  const branches = await prisma.branch.findMany();
  const settings = await prisma.branchSettings.findMany();
  const hours = await prisma.businessHour.findMany();

  console.log(JSON.stringify({
    plans,
    tenants,
    restaurants,
    branches,
    settings,
    hoursCount: hours.length
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });