require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("TEST_RESERVATION_AUDIT_ERROR:");
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TENANT_ID = "cmnrwsh4d0001ocvljmz1e1tn";
const BRANCH_ID = "cmnrwsh4q0003ocvl9azqxrr0";
const ZONE_ID = "cmnry9dvq0001bcvlhxgdzbe8";
const TABLE_ID = "cmnry9dvv0002bcvlpbm22tvt";

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function makeConfirmationCode() {
  return "TEST-" + Date.now();
}

async function main() {
  const now = new Date();
  const startAt = addMinutes(now, 90);
  const endAt = addMinutes(startAt, 120);

  const guest = await prisma.guest.create({
    data: {
      tenantId: TENANT_ID,
      firstName: "Audit",
      lastName: "Guest",
      fullName: "Audit Guest " + Date.now(),
      phone: "+38344111222",
      email: "audit+" + Date.now() + "@example.com",
      preferredLanguage: "en",
    },
  });

  const reservation = await prisma.reservation.create({
    data: {
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      guestId: guest.id,
      source: "MANUAL",
      status: "CONFIRMED",
      partySize: 2,
      reservationDate: startAt,
      startAt,
      endAt,
      requestedZoneId: ZONE_ID,
      assignedZoneId: ZONE_ID,
      assignedTableId: TABLE_ID,
      confirmationCode: makeConfirmationCode(),
      internalNote: "Audit test reservation",
      guestNote: "Created for reservation.created audit verification",
    },
  });

  await prisma.reservationStatusHistory.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservation.id,
      oldStatus: null,
      newStatus: "CONFIRMED",
      reason: "Initial creation for audit test",
    },
  });

  await prisma.reservationAssignmentLog.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservation.id,
      newTableId: TABLE_ID,
      newZoneId: ZONE_ID,
      reason: "Initial assignment for audit test",
    },
  });

  await prisma.securityEvent.create({
    data: {
      tenantId: TENANT_ID,
      type: "reservation.created",
      severity: "LOW",
      message: "Reservation created during backend audit verification",
      metadata: {
        reservationId: reservation.id,
        guestId: guest.id,
        branchId: BRANCH_ID,
        assignedTableId: TABLE_ID,
        assignedZoneId: ZONE_ID,
        partySize: reservation.partySize,
        status: reservation.status,
      },
    },
  });

  console.log("RESERVATION_CREATED_AUDIT_TEST_OK");
  console.log("GUEST_ID:", guest.id);
  console.log("RESERVATION_ID:", reservation.id);
  console.log("START_AT:", startAt.toISOString());
  console.log("END_AT:", endAt.toISOString());
}

main()
  .catch((error) => {
    console.error("TEST_RESERVATION_AUDIT_ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });