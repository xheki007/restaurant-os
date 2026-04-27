const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const before = await prisma.tableCombination.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    console.log("BEFORE:");
    console.log(JSON.stringify(before, null, 2));

    const deleted = await prisma.tableCombination.deleteMany({});

    console.log("DELETED COUNT:", deleted.count);

    const after = await prisma.tableCombination.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    console.log("AFTER:");
    console.log(JSON.stringify(after, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});