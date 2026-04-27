-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "preferredLanguage" TEXT,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "vipLevel" TEXT,
    "blacklistStatus" BOOLEAN NOT NULL DEFAULT false,
    "blacklistReason" TEXT,
    "preferredZoneId" TEXT,
    "preferredTableId" TEXT,
    "preferredSeatingNote" TEXT,
    "allergiesNote" TEXT,
    "dietaryPreference" TEXT,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "cancellationCount" INTEGER NOT NULL DEFAULT 0,
    "averagePartySize" DOUBLE PRECISION,
    "lastVisitAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestTag" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestTagMap" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestTagMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestNote" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "authorUserId" TEXT,
    "note" TEXT NOT NULL,
    "visibility" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Guest_tenantId_idx" ON "Guest"("tenantId");

-- CreateIndex
CREATE INDEX "Guest_phone_idx" ON "Guest"("phone");

-- CreateIndex
CREATE INDEX "Guest_email_idx" ON "Guest"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_tenantId_fullName_phone_key" ON "Guest"("tenantId", "fullName", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "GuestProfile_guestId_key" ON "GuestProfile"("guestId");

-- CreateIndex
CREATE INDEX "GuestProfile_tenantId_idx" ON "GuestProfile"("tenantId");

-- CreateIndex
CREATE INDEX "GuestProfile_blacklistStatus_idx" ON "GuestProfile"("blacklistStatus");

-- CreateIndex
CREATE INDEX "GuestTag_tenantId_idx" ON "GuestTag"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTag_tenantId_name_key" ON "GuestTag"("tenantId", "name");

-- CreateIndex
CREATE INDEX "GuestTagMap_guestId_idx" ON "GuestTagMap"("guestId");

-- CreateIndex
CREATE INDEX "GuestTagMap_tagId_idx" ON "GuestTagMap"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestTagMap_guestId_tagId_key" ON "GuestTagMap"("guestId", "tagId");

-- CreateIndex
CREATE INDEX "GuestNote_tenantId_idx" ON "GuestNote"("tenantId");

-- CreateIndex
CREATE INDEX "GuestNote_guestId_idx" ON "GuestNote"("guestId");

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestProfile" ADD CONSTRAINT "GuestProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestProfile" ADD CONSTRAINT "GuestProfile_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTag" ADD CONSTRAINT "GuestTag_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTagMap" ADD CONSTRAINT "GuestTagMap_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestTagMap" ADD CONSTRAINT "GuestTagMap_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "GuestTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestNote" ADD CONSTRAINT "GuestNote_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
