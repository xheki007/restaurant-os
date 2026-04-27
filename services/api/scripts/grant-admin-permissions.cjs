const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv/config");

async function main() {
  const tenantSlug = process.argv[2];

  if (!tenantSlug) {
    throw new Error("Usage: node scripts/grant-admin-permissions.cjs <tenant-slug>");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, name: true },
    });

    if (!tenant) {
      throw new Error("Tenant not found for slug: " + tenantSlug);
    }

    const adminRole = await prisma.role.findFirst({
      where: {
        tenantId: tenant.id,
        code: "ADMIN",
      },
      select: { id: true, code: true, name: true },
    });

    if (!adminRole) {
      throw new Error("ADMIN role not found for tenant: " + tenant.slug);
    }

    const permissions = await prisma.permission.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    });

    if (!permissions.length) {
      throw new Error("No permissions found in database.");
    }

    let createdCount = 0;

    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });

      createdCount += 1;
    }

    const finalLinks = await prisma.rolePermission.count({
      where: { roleId: adminRole.id },
    });

    console.log(JSON.stringify({
      ok: true,
      tenant,
      adminRole,
      permissionsFound: permissions.length,
      processed: createdCount,
      totalRolePermissionsNow: finalLinks,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});