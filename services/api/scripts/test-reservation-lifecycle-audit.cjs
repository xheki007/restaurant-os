require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("TEST_RESERVATION_LIFECYCLE_ERROR:");
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

function makeConfirmationCode(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
}

async function createGuest(label) {
  return prisma.guest.create({
    data: {
      tenantId: TENANT_ID,
      firstName: label,
      lastName: "Guest",
      fullName: label + " Guest " + Date.now(),
      phone: "+38344111" + Math.floor(100 + Math.random() * 899),
      email: label.toLowerCase() + "+" + Date.now() + "@example.com",
      preferredLanguage: "en",
    },
  });
}

async function createReservation(label, startOffsetMin) {
  const now = new Date();
  const startAt = addMinutes(now, startOffsetMin);
  const endAt = addMinutes(startAt, 120);
  const guest = await createGuest(label);

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
      confirmationCode: makeConfirmationCode(label.toUpperCase()),
      internalNote: label + " lifecycle audit test",
      guestNote: label + " lifecycle audit verification",
    },
  });

  await prisma.reservationStatusHistory.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservation.id,
      oldStatus: null,
      newStatus: "CONFIRMED",
      reason: label + " initial creation",
    },
  });

  await prisma.reservationAssignmentLog.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservation.id,
      newTableId: TABLE_ID,
      newZoneId: ZONE_ID,
      reason: label + " initial assignment",
    },
  });

  await prisma.securityEvent.create({
    data: {
      tenantId: TENANT_ID,
      type: "reservation.created",
      severity: "LOW",
      message: label + " reservation created for lifecycle audit verification",
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

  return { guest, reservation };
}

async function markSeated(reservationId) {
  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "SEATED",
      seatedAt: new Date(),
    },
  });

  await prisma.reservationStatusHistory.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservationId,
      oldStatus: "CONFIRMED",
      newStatus: "SEATED",
      reason: "Lifecycle audit test seated transition",
    },
  });

  await prisma.securityEvent.create({
    data: {
      tenantId: TENANT_ID,
      type: "reservation.seated",
      severity: "LOW",
      message: "Reservation seated during lifecycle audit verification",
      metadata: {
        reservationId: updated.id,
        branchId: BRANCH_ID,
        assignedTableId: updated.assignedTableId,
        assignedZoneId: updated.assignedZoneId,
        status: updated.status,
      },
    },
  });

  return updated;
}

async function markCompleted(reservationId) {
  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  await prisma.reservationStatusHistory.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservationId,
      oldStatus: "SEATED",
      newStatus: "COMPLETED",
      reason: "Lifecycle audit test completed transition",
    },
  });

  await prisma.securityEvent.create({
    data: {
      tenantId: TENANT_ID,
      type: "reservation.completed",
      severity: "LOW",
      message: "Reservation completed during lifecycle audit verification",
      metadata: {
        reservationId: updated.id,
        branchId: BRANCH_ID,
        assignedTableId: updated.assignedTableId,
        assignedZoneId: updated.assignedZoneId,
        status: updated.status,
      },
    },
  });

  return updated;
}

async function markCancelled(reservationId) {
  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  await prisma.reservationStatusHistory.create({
    data: {
      tenantId: TENANT_ID,
      reservationId: reservationId,
      oldStatus: "CONFIRMED",
      newStatus: "CANCELLED",
      reason: "Lifecycle audit test cancelled transition",
    },
  });

  await prisma.securityEvent.create({
    data: {
      tenantId: TENANT_ID,
      type: "reservation.cancelled",
      severity: "LOW",
      message: "Reservation cancelled during lifecycle audit verification",
      metadata: {
        reservationId: updated.id,
        branchId: BRANCH_ID,
        assignedTableId: updated.assignedTableId,
        assignedZoneId: updated.assignedZoneId,
        status: updated.status,
      },
    },
  });

  return updated;
}

async function main() {
  const completedFlow = await createReservation("CompletedFlow", 180);
  await markSeated(completedFlow.reservation.id);
  await markCompleted(completedFlow.reservation.id);

  const cancelledFlow = await createReservation("CancelledFlow", 360);
  await markCancelled(cancelledFlow.reservation.id);

  console.log("RESERVATION_LIFECYCLE_AUDIT_TEST_OK");
  console.log("COMPLETED_FLOW_RESERVATION_ID:", completedFlow.reservation.id);
  console.log("CANCELLED_FLOW_RESERVATION_ID:", cancelledFlow.reservation.id);
}

main()
  .catch((error) => {
    console.error("TEST_RESERVATION_LIFECYCLE_ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });