require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("CREATE_LAYOUT_ERROR:");
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

async function main() {
  const branch = await prisma.branch.findFirst({
    where: {
      id: BRANCH_ID,
      tenantId: TENANT_ID,
    },
    select: {
      id: true,
      tenantId: true,
      name: true,
      code: true,
    },
  });

  if (!branch) {
    throw new Error("Branch not found for provided tenantId/branchId");
  }

  let floorPlan = await prisma.floorPlan.findFirst({
    where: {
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      name: "Main Floor",
      version: 1,
    },
  });

  if (!floorPlan) {
    floorPlan = await prisma.floorPlan.create({
      data: {
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        name: "Main Floor",
        version: 1,
        canvasWidth: 1920,
        canvasHeight: 1080,
        isActive: true,
      },
    });
  }

  let zone = await prisma.zone.findFirst({
    where: {
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      code: "MAIN",
    },
  });

  if (!zone) {
    zone = await prisma.zone.create({
      data: {
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        floorPlanId: floorPlan.id,
        name: "Main Indoor",
        code: "MAIN",
        type: "INDOOR",
        color: "#2563EB",
        sortOrder: 1,
        isActive: true,
      },
    });
  }

  let table = await prisma.restaurantTable.findFirst({
    where: {
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      code: "T1",
    },
  });

  if (!table) {
    table = await prisma.restaurantTable.create({
      data: {
        tenantId: TENANT_ID,
        branchId: BRANCH_ID,
        zoneId: zone.id,
        floorPlanId: floorPlan.id,
        name: "Table 1",
        code: "T1",
        capacityMin: 2,
        capacityMax: 4,
        shape: "ROUND",
        posX: 200,
        posY: 180,
        width: 120,
        height: 120,
        rotation: 0,
        isActive: true,
      },
    });
  }

  console.log("MINIMAL_LAYOUT_READY");
  console.log("TENANT_ID:", TENANT_ID);
  console.log("BRANCH_ID:", BRANCH_ID);
  console.log("FLOOR_PLAN_ID:", floorPlan.id);
  console.log("ZONE_ID:", zone.id);
  console.log("TABLE_ID:", table.id);
}

main()
  .catch((error) => {
    console.error("CREATE_LAYOUT_ERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });