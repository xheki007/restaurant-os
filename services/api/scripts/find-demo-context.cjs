const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const tenant = await prisma.tenant.findFirst({
    where: { slug: { contains: "demo" } },
    include: { branches: true }
  });

  console.log(JSON.stringify({
    tenantId: tenant?.id,
    tenantSlug: tenant?.slug,
    branchId: tenant?.branches?.[0]?.id
  }, null, 2));

  await prisma.$disconnect();
  await pool.end();
})();