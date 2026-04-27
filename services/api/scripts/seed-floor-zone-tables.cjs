require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const tenantId = "cmnptyeth0001hgvuq0yst1tz";
  const branchId = "cmnpu3k5i0001q0vuardkt0ef";

  const floorPlan = await prisma.floorPlan.upsert({
    where: {
      branchId_name_version: {
        branchId,
        name: "Main Floor",
        version: 1,
      },
    },
    update: {
      isActive: true,
      canvasWidth: 1920,
      canvasHeight: 1080,
    },
    create: {
      tenantId,
      branchId,
      name: "Main Floor",
      version: 1,
      canvasWidth: 1920,
      canvasHeight: 1080,
      isActive: true,
    },
  });

  const indoorZone = await prisma.zone.upsert({
    where: {
      branchId_code: {
        branchId,
        code: "INDOOR",
      },
    },
    update: {
      name: "Indoor",
      type: "INDOOR",
      floorPlanId: floorPlan.id,
      isActive: true,
      sortOrder: 1,
      color: "#1F2937",
    },
    create: {
      tenantId,
      branchId,
      floorPlanId: floorPlan.id,
      name: "Indoor",
      code: "INDOOR",
      type: "INDOOR",
      color: "#1F2937",
      sortOrder: 1,
      isActive: true,
    },
  });

  const terraceZone = await prisma.zone.upsert({
    where: {
      branchId_code: {
        branchId,
        code: "TERRACE",
      },
    },
    update: {
      name: "Terrace",
      type: "TERRACE",
      floorPlanId: floorPlan.id,
      isActive: true,
      sortOrder: 2,
      color: "#0F766E",
    },
    create: {
      tenantId,
      branchId,
      floorPlanId: floorPlan.id,
      name: "Terrace",
      code: "TERRACE",
      type: "TERRACE",
      color: "#0F766E",
      sortOrder: 2,
      isActive: true,
    },
  });

  const tables = [
    {
      name: "Table 1",
      code: "T1",
      zoneId: indoorZone.id,
      capacityMin: 2,
      capacityMax: 2,
      shape: "ROUND",
      posX: 120,
      posY: 140,
      width: 80,
      height: 80,
      rotation: 0,
    },
    {
      name: "Table 2",
      code: "T2",
      zoneId: indoorZone.id,
      capacityMin: 2,
      capacityMax: 4,
      shape: "SQUARE",
      posX: 260,
      posY: 140,
      width: 90,
      height: 90,
      rotation: 0,
    },
    {
      name: "Terrace 1",
      code: "TR1",
      zoneId: terraceZone.id,
      capacityMin: 2,
      capacityMax: 4,
      shape: "RECTANGLE",
      posX: 420,
      posY: 220,
      width: 120,
      height: 80,
      rotation: 0,
    },
  ];

  const createdTables = [];

  for (const t of tables) {
    const table = await prisma.restaurantTable.upsert({
      where: {
        branchId_code: {
          branchId,
          code: t.code,
        },
      },
      update: {
        tenantId,
        zoneId: t.zoneId,
        floorPlanId: floorPlan.id,
        name: t.name,
        capacityMin: t.capacityMin,
        capacityMax: t.capacityMax,
        shape: t.shape,
        posX: t.posX,
        posY: t.posY,
        width: t.width,
        height: t.height,
        rotation: t.rotation,
        isActive: true,
      },
      create: {
        tenantId,
        branchId,
        zoneId: t.zoneId,
        floorPlanId: floorPlan.id,
        name: t.name,
        code: t.code,
        capacityMin: t.capacityMin,
        capacityMax: t.capacityMax,
        shape: t.shape,
        posX: t.posX,
        posY: t.posY,
        width: t.width,
        height: t.height,
        rotation: t.rotation,
        isActive: true,
      },
    });

    createdTables.push(table);
  }

  console.log(JSON.stringify({
    floorPlan,
    indoorZone,
    terraceZone,
    tables: createdTables,
  }, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });