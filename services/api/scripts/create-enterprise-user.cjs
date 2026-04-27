// PATH: C:\restaurant-os\services\api\scripts\create-enterprise-user.cjs

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");
const bcrypt = require("bcryptjs");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

// 🔧 CHANGE THESE VALUES ONLY
const USER_EMAIL = "admin@demo.com";
const USER_PASSWORD = "Admin123!";
const TENANT_SLUG = "demo-restaurant";
const ROLE_CODE = "tenant_owner";

async function main() {
  console.log("Creating enterprise user...");

  const tenant = await prisma.tenant.findUnique({
    where: { slug: TENANT_SLUG },
  });

  if (!tenant) throw new Error("Tenant not found");

  const role = await prisma.role.findUnique({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: ROLE_CODE,
      },
    },
  });

  if (!role) throw new Error("Role not found");

  const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: USER_EMAIL,
      },
    },
    update: {
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email: USER_EMAIL,
      passwordHash,
      status: "ACTIVE",
    },
  });

  // 🔥 FIX: jo upsert, por kontroll + create
  const existing = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      branchId: null,
    },
  });

  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        branchId: null,
      },
    });
  }

  console.log("User ready:");
  console.log({
    email: user.email,
    tenant: TENANT_SLUG,
    role: ROLE_CODE,
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });