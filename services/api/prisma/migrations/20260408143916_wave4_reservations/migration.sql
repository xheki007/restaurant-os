-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'WAITLISTED');

-- CreateEnum
CREATE TYPE "ReservationSource" AS ENUM ('ONLINE', 'WALK_IN', 'PHONE', 'MANUAL');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "source" "ReservationSource" NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "partySize" INTEGER NOT NULL,
    "reservationDate" TIMESTAMP(3) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "requestedZoneId" TEXT,
    "assignedZoneId" TEXT,
    "assignedTableId" TEXT,
    "assignedCombinationId" TEXT,
    "occasion" TEXT,
    "internalNote" TEXT,
    "guestNote" TEXT,
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "isPhoneReservation" BOOLEAN NOT NULL DEFAULT false,
    "confirmationCode" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "seatedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationStatusHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "oldStatus" "ReservationStatus",
    "newStatus" "ReservationStatus" NOT NULL,
    "changedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationTagMap" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservationTagMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "partySize" INTEGER NOT NULL,
    "requestedDate" TIMESTAMP(3) NOT NULL,
    "requestedStartAt" TIMESTAMP(3),
    "requestedZoneId" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'WAITLISTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReservationAssignmentLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "oldTableId" TEXT,
    "newTableId" TEXT,
    "oldZoneId" TEXT,
    "newZoneId" TEXT,
    "assignedByUserId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationAssignmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "operator" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueText" TEXT,
    "valueJson" JSONB,
    "appliesToZoneId" TEXT,
    "appliesToDayOfWeek" INTEGER,
    "startTime" TEXT,
    "endTime" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapacitySnapshot" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "slotStartAt" TIMESTAMP(3) NOT NULL,
    "slotEndAt" TIMESTAMP(3) NOT NULL,
    "zoneId" TEXT,
    "tableId" TEXT,
    "totalTables" INTEGER NOT NULL,
    "reservedTables" INTEGER NOT NULL DEFAULT 0,
    "seatedTables" INTEGER NOT NULL DEFAULT 0,
    "blockedTables" INTEGER NOT NULL DEFAULT 0,
    "walkInReservedTables" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapacitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_confirmationCode_key" ON "Reservation"("confirmationCode");

-- CreateIndex
CREATE INDEX "Reservation_tenantId_idx" ON "Reservation"("tenantId");

-- CreateIndex
CREATE INDEX "Reservation_branchId_idx" ON "Reservation"("branchId");

-- CreateIndex
CREATE INDEX "Reservation_guestId_idx" ON "Reservation"("guestId");

-- CreateIndex
CREATE INDEX "Reservation_reservationDate_idx" ON "Reservation"("reservationDate");

-- CreateIndex
CREATE INDEX "Reservation_startAt_idx" ON "Reservation"("startAt");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "Reservation"("status");

-- CreateIndex
CREATE INDEX "Reservation_requestedZoneId_idx" ON "Reservation"("requestedZoneId");

-- CreateIndex
CREATE INDEX "Reservation_assignedZoneId_idx" ON "Reservation"("assignedZoneId");

-- CreateIndex
CREATE INDEX "Reservation_assignedTableId_idx" ON "Reservation"("assignedTableId");

-- CreateIndex
CREATE INDEX "ReservationStatusHistory_tenantId_idx" ON "ReservationStatusHistory"("tenantId");

-- CreateIndex
CREATE INDEX "ReservationStatusHistory_reservationId_idx" ON "ReservationStatusHistory"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationStatusHistory_createdAt_idx" ON "ReservationStatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "ReservationTag_tenantId_idx" ON "ReservationTag"("tenantId");

-- CreateIndex
CREATE INDEX "ReservationTag_branchId_idx" ON "ReservationTag"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationTag_branchId_name_key" ON "ReservationTag"("branchId", "name");

-- CreateIndex
CREATE INDEX "ReservationTagMap_reservationId_idx" ON "ReservationTagMap"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationTagMap_tagId_idx" ON "ReservationTagMap"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ReservationTagMap_reservationId_tagId_key" ON "ReservationTagMap"("reservationId", "tagId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_tenantId_idx" ON "WaitlistEntry"("tenantId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_branchId_idx" ON "WaitlistEntry"("branchId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_guestId_idx" ON "WaitlistEntry"("guestId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_requestedDate_idx" ON "WaitlistEntry"("requestedDate");

-- CreateIndex
CREATE INDEX "WaitlistEntry_status_idx" ON "WaitlistEntry"("status");

-- CreateIndex
CREATE INDEX "ReservationAssignmentLog_tenantId_idx" ON "ReservationAssignmentLog"("tenantId");

-- CreateIndex
CREATE INDEX "ReservationAssignmentLog_reservationId_idx" ON "ReservationAssignmentLog"("reservationId");

-- CreateIndex
CREATE INDEX "ReservationAssignmentLog_createdAt_idx" ON "ReservationAssignmentLog"("createdAt");

-- CreateIndex
CREATE INDEX "BookingPolicy_tenantId_idx" ON "BookingPolicy"("tenantId");

-- CreateIndex
CREATE INDEX "BookingPolicy_branchId_idx" ON "BookingPolicy"("branchId");

-- CreateIndex
CREATE INDEX "BookingPolicy_isActive_idx" ON "BookingPolicy"("isActive");

-- CreateIndex
CREATE INDEX "BookingPolicy_priority_idx" ON "BookingPolicy"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPolicy_branchId_name_key" ON "BookingPolicy"("branchId", "name");

-- CreateIndex
CREATE INDEX "BookingRule_tenantId_idx" ON "BookingRule"("tenantId");

-- CreateIndex
CREATE INDEX "BookingRule_branchId_idx" ON "BookingRule"("branchId");

-- CreateIndex
CREATE INDEX "BookingRule_policyId_idx" ON "BookingRule"("policyId");

-- CreateIndex
CREATE INDEX "BookingRule_appliesToZoneId_idx" ON "BookingRule"("appliesToZoneId");

-- CreateIndex
CREATE INDEX "BookingRule_ruleType_idx" ON "BookingRule"("ruleType");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_tenantId_idx" ON "CapacitySnapshot"("tenantId");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_branchId_idx" ON "CapacitySnapshot"("branchId");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_date_idx" ON "CapacitySnapshot"("date");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_slotStartAt_idx" ON "CapacitySnapshot"("slotStartAt");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_zoneId_idx" ON "CapacitySnapshot"("zoneId");

-- CreateIndex
CREATE INDEX "CapacitySnapshot_tableId_idx" ON "CapacitySnapshot"("tableId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_requestedZoneId_fkey" FOREIGN KEY ("requestedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assignedZoneId_fkey" FOREIGN KEY ("assignedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assignedTableId_fkey" FOREIGN KEY ("assignedTableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_assignedCombinationId_fkey" FOREIGN KEY ("assignedCombinationId") REFERENCES "TableCombination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationStatusHistory" ADD CONSTRAINT "ReservationStatusHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationStatusHistory" ADD CONSTRAINT "ReservationStatusHistory_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTag" ADD CONSTRAINT "ReservationTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTag" ADD CONSTRAINT "ReservationTag_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTagMap" ADD CONSTRAINT "ReservationTagMap_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationTagMap" ADD CONSTRAINT "ReservationTagMap_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ReservationTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_requestedZoneId_fkey" FOREIGN KEY ("requestedZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAssignmentLog" ADD CONSTRAINT "ReservationAssignmentLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAssignmentLog" ADD CONSTRAINT "ReservationAssignmentLog_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAssignmentLog" ADD CONSTRAINT "ReservationAssignmentLog_oldTableId_fkey" FOREIGN KEY ("oldTableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReservationAssignmentLog" ADD CONSTRAINT "ReservationAssignmentLog_newTableId_fkey" FOREIGN KEY ("newTableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPolicy" ADD CONSTRAINT "BookingPolicy_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "BookingPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingRule" ADD CONSTRAINT "BookingRule_appliesToZoneId_fkey" FOREIGN KEY ("appliesToZoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacitySnapshot" ADD CONSTRAINT "CapacitySnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacitySnapshot" ADD CONSTRAINT "CapacitySnapshot_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacitySnapshot" ADD CONSTRAINT "CapacitySnapshot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapacitySnapshot" ADD CONSTRAINT "CapacitySnapshot_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
