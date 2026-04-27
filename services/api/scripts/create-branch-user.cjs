// PATH: C:\restaurant-os\services\api\scripts\create-branch-user.cjs

const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

(async () => {
  console.log("Creating branch user...");

  const tenant = await prisma.tenant.findFirst({
    where: { slug: "demo-restaurant" },
  });

  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "asc" },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const role = await prisma.role.findFirst({
    where: {
      tenantId: tenant.id,
      code: "branch_manager",
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  const email = "manager@demo.com";
  const plainPassword = "Branch123!";
  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email,
      },
    },
    update: {
      passwordHash,
      status: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      status: "ACTIVE",
    },
  });

  const existingUserRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      branchId: branch.id,
    },
  });

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        branchId: branch.id,
      },
    });
  }

  console.log("Branch user ready:");
  console.log({
    email,
    password: plainPassword,
    tenantSlug: tenant.slug,
    branchId: branch.id,
    roleCode: role.code,
  });

  await prisma.$disconnect();
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});