require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const plan = await prisma.subscriptionPlan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      priceMonthly: "49.00",
      priceYearly: "490.00",
      maxBranches: 3,
      maxUsers: 15,
      isActive: true
    }
  });

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      name: "Demo Restaurant Tenant",
      slug: "demo-restaurant",
      status: "TRIAL",
      timezone: "Europe/Belgrade",
      defaultLanguage: "en",
      currency: "EUR"
    }
  });

  const restaurant = await prisma.restaurant.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: "Demo Restaurant"
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Demo Restaurant"
    }
  });

  const branch = await prisma.branch.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: "MAIN"
      }
    },
    update: {},
    create: {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: "Main Branch",
      code: "MAIN",
      addressLine1: "Center",
      city: "Prishtina",
      country: "Kosovo",
      timezone: "Europe/Belgrade",
      currency: "EUR"
    }
  });

  await prisma.branchSettings.upsert({
    where: { branchId: branch.id },
    update: {},
    create: {
      tenantId: tenant.id,
      branchId: branch.id
    }
  });

  const days = [1,2,3,4,5,6,7];

  for (const d of days) {
    await prisma.businessHour.upsert({
      where: {
        branchId_dayOfWeek_serviceType: {
          branchId: branch.id,
          dayOfWeek: d,
          serviceType: "ALL_DAY"
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        branchId: branch.id,
        dayOfWeek: d,
        openTime: "09:00",
        closeTime: "23:00",
        serviceType: "ALL_DAY"
      }
    });
  }

  console.log("FULL SEED OK");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });