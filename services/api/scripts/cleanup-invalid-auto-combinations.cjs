const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toPositionedTable(table) {
  const safeWidth = Math.max(1, Number(table?.width ?? 80) || 80);
  const safeHeight = Math.max(1, Number(table?.height ?? 80) || 80);
  const left = Number(table?.posX ?? 0) || 0;
  const top = Number(table?.posY ?? 0) || 0;

  return {
    id: String(table?.id || ""),
    code: String(table?.code || ""),
    name: String(table?.name || ""),
    zoneId: table?.zoneId ?? null,
    isActive: table?.isActive,
    left,
    top,
    right: left + safeWidth,
    bottom: top + safeHeight,
    centerX: left + safeWidth / 2,
    centerY: top + safeHeight / 2,
    safeWidth,
    safeHeight,
    safeCapacityMin: Math.max(0, Number(table?.capacityMin ?? 0) || 0),
    safeCapacityMax: Math.max(0, Number(table?.capacityMax ?? 0) || 0),
  };
}

function isDirectHorizontalNeighbor(leftTable, rightTable) {
  if ((leftTable.zoneId ?? null) !== (rightTable.zoneId ?? null)) {
    return false;
  }

  const verticalTolerance = Math.max(
    32,
    Math.min(leftTable.safeHeight, rightTable.safeHeight) * 0.65,
  );

  if (Math.abs(leftTable.centerY - rightTable.centerY) > verticalTolerance) {
    return false;
  }

  const horizontalGap = rightTable.left - leftTable.right;

  const maxAllowedGap = Math.max(
    64,
    Math.min(leftTable.safeWidth, rightTable.safeWidth) * 1.25,
  );

  const maxAllowedOverlap =
    Math.min(leftTable.safeWidth, rightTable.safeWidth) * 0.25;

  return horizontalGap >= -maxAllowedOverlap && horizontalGap <= maxAllowedGap;
}

function isPhysicallyValidTableSequence(tables) {
  if (!Array.isArray(tables) || tables.length < 2) {
    return false;
  }

  const positionedTables = tables
    .filter(Boolean)
    .map(toPositionedTable)
    .filter((table) => table.id && table.isActive !== false);

  if (positionedTables.length !== tables.length) {
    return false;
  }

  const firstZoneId = positionedTables[0]?.zoneId ?? null;

  if (!positionedTables.every((table) => (table.zoneId ?? null) === firstZoneId)) {
    return false;
  }

  const orderedTables = [...positionedTables].sort((a, b) => {
    const xCompare = a.left - b.left;

    if (xCompare !== 0) {
      return xCompare;
    }

    return String(a.name || a.code || a.id).localeCompare(String(b.name || b.code || b.id));
  });

  for (let index = 1; index < orderedTables.length; index += 1) {
    if (!isDirectHorizontalNeighbor(orderedTables[index - 1], orderedTables[index])) {
      return false;
    }
  }

  return true;
}

async function main() {
  const combinations = await prisma.tableCombination.findMany({
    where: {
      isActive: true,
      name: {
        startsWith: "AUTO:",
      },
    },
    include: {
      items: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          table: true,
        },
      },
    },
  });

  const backupPath = process.env.AUTO_COMBO_BACKUP_PATH;

  if (backupPath) {
    fs.writeFileSync(
      backupPath,
      JSON.stringify(combinations, null, 2),
      "utf8",
    );
  }

  const invalid = [];

  for (const combination of combinations) {
    const tables = combination.items.map((item) => item.table).filter(Boolean);
    const isValid = isPhysicallyValidTableSequence(tables);

    if (!isValid) {
      invalid.push({
        id: combination.id,
        name: combination.name,
        tableCodes: tables.map((table) => table.code),
      });

      await prisma.tableCombination.update({
        where: {
          id: combination.id,
        },
        data: {
          isActive: false,
        },
      });
    }
  }

  if (invalid.length > 0) {
    const invalidIds = invalid.map((item) => item.id);

    await prisma.reservation.updateMany({
      where: {
        assignedCombinationId: {
          in: invalidIds,
        },
        status: {
          in: ["PENDING", "CONFIRMED", "SEATED"],
        },
      },
      data: {
        assignedCombinationId: null,
        assignedTableId: null,
        assignedZoneId: null,
      },
    });
  }

  console.log(JSON.stringify({
    checkedAutoCombinations: combinations.length,
    invalidAutoCombinationsDisabled: invalid.length,
    invalid,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });