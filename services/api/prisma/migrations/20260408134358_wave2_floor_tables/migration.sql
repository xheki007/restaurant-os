/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,planId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ZoneType" AS ENUM ('INDOOR', 'TERRACE', 'VIP', 'BAR', 'PRIVATE_ROOM');

-- CreateEnum
CREATE TYPE "TableShape" AS ENUM ('SQUARE', 'RECTANGLE', 'ROUND');

-- CreateEnum
CREATE TYPE "TableState" AS ENUM ('AVAILABLE', 'RESERVED', 'SEATED', 'OCCUPIED', 'BLOCKED', 'CLEANING');

-- CreateTable
CREATE TABLE "FloorPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "canvasWidth" INTEGER NOT NULL DEFAULT 1920,
    "canvasHeight" INTEGER NOT NULL DEFAULT 1080,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ZoneType" NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZoneAvailabilityRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "startMonth" INTEGER,
    "endMonth" INTEGER,
    "weatherCondition" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneAvailabilityRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantTable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "floorPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacityMin" INTEGER NOT NULL,
    "capacityMax" INTEGER NOT NULL,
    "shape" "TableShape" NOT NULL,
    "posX" DOUBLE PRECISION,
    "posY" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableCombination" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacityMin" INTEGER NOT NULL,
    "capacityMax" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableCombination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableCombinationItem" (
    "id" TEXT NOT NULL,
    "combinationId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableCombinationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TableStateLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "state" "TableState" NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableStateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FloorPlan_tenantId_idx" ON "FloorPlan"("tenantId");

-- CreateIndex
CREATE INDEX "FloorPlan_branchId_idx" ON "FloorPlan"("branchId");

-- CreateIndex
CREATE INDEX "FloorPlan_isActive_idx" ON "FloorPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FloorPlan_branchId_name_version_key" ON "FloorPlan"("branchId", "name", "version");

-- CreateIndex
CREATE INDEX "Zone_tenantId_idx" ON "Zone"("tenantId");

-- CreateIndex
CREATE INDEX "Zone_branchId_idx" ON "Zone"("branchId");

-- CreateIndex
CREATE INDEX "Zone_floorPlanId_idx" ON "Zone"("floorPlanId");

-- CreateIndex
CREATE INDEX "Zone_isActive_idx" ON "Zone"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_branchId_code_key" ON "Zone"("branchId", "code");

-- CreateIndex
CREATE INDEX "ZoneAvailabilityRule_tenantId_idx" ON "ZoneAvailabilityRule"("tenantId");

-- CreateIndex
CREATE INDEX "ZoneAvailabilityRule_branchId_idx" ON "ZoneAvailabilityRule"("branchId");

-- CreateIndex
CREATE INDEX "ZoneAvailabilityRule_zoneId_idx" ON "ZoneAvailabilityRule"("zoneId");

-- CreateIndex
CREATE INDEX "ZoneAvailabilityRule_isEnabled_idx" ON "ZoneAvailabilityRule"("isEnabled");

-- CreateIndex
CREATE INDEX "RestaurantTable_tenantId_idx" ON "RestaurantTable"("tenantId");

-- CreateIndex
CREATE INDEX "RestaurantTable_branchId_idx" ON "RestaurantTable"("branchId");

-- CreateIndex
CREATE INDEX "RestaurantTable_zoneId_idx" ON "RestaurantTable"("zoneId");

-- CreateIndex
CREATE INDEX "RestaurantTable_floorPlanId_idx" ON "RestaurantTable"("floorPlanId");

-- CreateIndex
CREATE INDEX "RestaurantTable_isActive_idx" ON "RestaurantTable"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_branchId_code_key" ON "RestaurantTable"("branchId", "code");

-- CreateIndex
CREATE INDEX "TableCombination_tenantId_idx" ON "TableCombination"("tenantId");

-- CreateIndex
CREATE INDEX "TableCombination_branchId_idx" ON "TableCombination"("branchId");

-- CreateIndex
CREATE INDEX "TableCombination_isActive_idx" ON "TableCombination"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TableCombination_branchId_name_key" ON "TableCombination"("branchId", "name");

-- CreateIndex
CREATE INDEX "TableCombinationItem_combinationId_idx" ON "TableCombinationItem"("combinationId");

-- CreateIndex
CREATE INDEX "TableCombinationItem_tableId_idx" ON "TableCombinationItem"("tableId");

-- CreateIndex
CREATE UNIQUE INDEX "TableCombinationItem_combinationId_tableId_key" ON "TableCombinationItem"("combinationId", "tableId");

-- CreateIndex
CREATE INDEX "TableStateLog_tenantId_idx" ON "TableStateLog"("tenantId");

-- CreateIndex
CREATE INDEX "TableStateLog_branchId_idx" ON "TableStateLog"("branchId");

-- CreateIndex
CREATE INDEX "TableStateLog_tableId_idx" ON "TableStateLog"("tableId");

-- CreateIndex
CREATE INDEX "TableStateLog_state_idx" ON "TableStateLog"("state");

-- CreateIndex
CREATE INDEX "TableStateLog_createdAt_idx" ON "TableStateLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_planId_key" ON "Subscription"("tenantId", "planId");

-- AddForeignKey
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FloorPlan" ADD CONSTRAINT "FloorPlan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneAvailabilityRule" ADD CONSTRAINT "ZoneAvailabilityRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneAvailabilityRule" ADD CONSTRAINT "ZoneAvailabilityRule_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZoneAvailabilityRule" ADD CONSTRAINT "ZoneAvailabilityRule_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_floorPlanId_fkey" FOREIGN KEY ("floorPlanId") REFERENCES "FloorPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombination" ADD CONSTRAINT "TableCombination_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombination" ADD CONSTRAINT "TableCombination_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombinationItem" ADD CONSTRAINT "TableCombinationItem_combinationId_fkey" FOREIGN KEY ("combinationId") REFERENCES "TableCombination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableCombinationItem" ADD CONSTRAINT "TableCombinationItem_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableStateLog" ADD CONSTRAINT "TableStateLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableStateLog" ADD CONSTRAINT "TableStateLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableStateLog" ADD CONSTRAINT "TableStateLog_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "RestaurantTable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
