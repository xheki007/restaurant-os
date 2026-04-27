// PATH: C:\restaurant-os\services\api\scripts\create-branch2-dashboard-fixture.cjs

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

function randomCode(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

(async () => {
  console.log("Creating branch 2 dashboard fixture...");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: "demo-restaurant" },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  let branch = await prisma.branch.findFirst({
    where: {
      tenantId: tenant.id,
      code: "BR2",
    },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        restaurantId: restaurant.id,
        name: "Second Branch",
        code: "BR2",
        addressLine1: "Second Location",
        city: "Prishtina",
        country: "Kosovo",
        timezone: "Europe/Belgrade",
        currency: "EUR",
        isActive: true,
      },
    });
  }

  let guest = await prisma.guest.findFirst({
    where: {
      tenantId: tenant.id,
      email: "branch2.fixture@example.com",
    },
  });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        tenantId: tenant.id,
        firstName: "Branch2",
        lastName: "Fixture",
        fullName: "Branch2 Fixture",
        phone: "+38344999999",
        email: "branch2.fixture@example.com",
        marketingOptIn: false,
      },
    });
  }

  const reservationFixtures = [
    {
      internalNote: "BRANCH2_FIXTURE_CONFIRMED",
      status: "CONFIRMED",
      reservationDate: new Date("2026-04-10T00:00:00.000Z"),
      startAt: new Date("2026-04-10T19:00:00.000Z"),
      endAt: new Date("2026-04-10T21:00:00.000Z"),
      guestNote: "Branch 2 confirmed test",
    },
    {
      internalNote: "BRANCH2_FIXTURE_CANCELLED",
      status: "CANCELLED",
      reservationDate: new Date("2026-04-09T00:00:00.000Z"),
      startAt: new Date("2026-04-09T19:00:00.000Z"),
      endAt: new Date("2026-04-09T21:00:00.000Z"),
      guestNote: "Branch 2 cancelled test",
      cancelledAt: new Date("2026-04-09T18:00:00.000Z"),
    },
  ];

  for (const fixture of reservationFixtures) {
    const existing = await prisma.reservation.findFirst({
      where: {
        tenantId: tenant.id,
        branchId: branch.id,
        internalNote: fixture.internalNote,
      },
    });

    if (existing) {
      console.log(`Fixture already exists: ${fixture.internalNote}`);
      continue;
    }

    const reservation = await prisma.reservation.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        guestId: guest.id,
        source: "MANUAL",
        status: fixture.status,
        partySize: 2,
        reservationDate: fixture.reservationDate,
        startAt: fixture.startAt,
        endAt: fixture.endAt,
        guestNote: fixture.guestNote,
        internalNote: fixture.internalNote,
        isWalkIn: false,
        isPhoneReservation: false,
        confirmationCode: randomCode("RSV"),
        cancelledAt: fixture.cancelledAt ?? null,
      },
    });

    await prisma.reservationStatusHistory.create({
      data: {
        tenantId: tenant.id,
        reservationId: reservation.id,
        oldStatus: null,
        newStatus: fixture.status,
        reason: `Fixture created for ${fixture.internalNote}`,
      },
    });

    console.log(`Created reservation fixture: ${fixture.internalNote}`);
  }

  console.log("Branch 2 fixture ready:");
  console.log({
    tenantSlug: tenant.slug,
    branchId: branch.id,
    branchCode: branch.code,
  });

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});