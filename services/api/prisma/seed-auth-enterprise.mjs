// PATH: C:\restaurant-os\services\api\prisma\seed-auth-enterprise.mjs

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const permissions = [
  { code: "users.create", module: "users", action: "create", description: "Create users" },
  { code: "users.read", module: "users", action: "read", description: "Read users" },
  { code: "users.update", module: "users", action: "update", description: "Update users" },
  { code: "users.delete", module: "users", action: "delete", description: "Delete users" },
  { code: "users.assign_role", module: "users", action: "assign_role", description: "Assign roles to users" },

  { code: "roles.create", module: "roles", action: "create", description: "Create roles" },
  { code: "roles.read", module: "roles", action: "read", description: "Read roles" },
  { code: "roles.update", module: "roles", action: "update", description: "Update roles" },
  { code: "roles.delete", module: "roles", action: "delete", description: "Delete roles" },
  { code: "roles.assign_permissions", module: "roles", action: "assign_permissions", description: "Assign permissions to roles" },

  { code: "reservations.create", module: "reservations", action: "create", description: "Create reservations" },
  { code: "reservations.read", module: "reservations", action: "read", description: "Read reservations" },
  { code: "reservations.update", module: "reservations", action: "update", description: "Update reservations" },
  { code: "reservations.cancel", module: "reservations", action: "cancel", description: "Cancel reservations" },
  { code: "reservations.assign", module: "reservations", action: "assign", description: "Assign reservation seating" },

  { code: "waitlist.read", module: "waitlist", action: "read", description: "Read waitlist entries" },
  { code: "waitlist.manage", module: "waitlist", action: "manage", description: "Manage waitlist entries" },
  { code: "waitlist.promote", module: "waitlist", action: "promote", description: "Promote waitlist entries" },

  { code: "guests.create", module: "guests", action: "create", description: "Create guests" },
  { code: "guests.read", module: "guests", action: "read", description: "Read guests" },
  { code: "guests.update", module: "guests", action: "update", description: "Update guests" },
  { code: "guests.delete", module: "guests", action: "delete", description: "Delete guests" },

  { code: "floorplans.read", module: "floorplans", action: "read", description: "Read floor plans" },
  { code: "floorplans.manage", module: "floorplans", action: "manage", description: "Manage floor plans" },
  { code: "zones.manage", module: "zones", action: "manage", description: "Manage zones" },
  { code: "tables.manage", module: "tables", action: "manage", description: "Manage tables" },

  { code: "branches.read", module: "branches", action: "read", description: "Read branches" },
  { code: "branches.manage", module: "branches", action: "manage", description: "Manage branches" },
  { code: "settings.manage", module: "settings", action: "manage", description: "Manage settings" },

  { code: "reports.read", module: "reports", action: "read", description: "Read reports" },
  { code: "analytics.read", module: "analytics", action: "read", description: "Read analytics" },

  { code: "audit.read", module: "audit", action: "read", description: "Read audit logs" },
  { code: "security.read", module: "security", action: "read", description: "Read security events" }
];

const roleTemplates = [
  {
    code: "tenant_owner",
    name: "Tenant Owner",
    description: "Full access across the tenant",
    isSystem: true,
    permissions: permissions.map((p) => p.code),
  },
  {
    code: "tenant_admin",
    name: "Tenant Admin",
    description: "Administrative access across the tenant",
    isSystem: true,
    permissions: permissions.filter((p) => p.code !== "security.read").map((p) => p.code),
  },
  {
    code: "branch_manager",
    name: "Branch Manager",
    description: "Operational branch access",
    isSystem: true,
    permissions: [
      "users.read",
      "roles.read",
      "reservations.create",
      "reservations.read",
      "reservations.update",
      "reservations.cancel",
      "reservations.assign",
      "waitlist.read",
      "waitlist.manage",
      "waitlist.promote",
      "guests.create",
      "guests.read",
      "guests.update",
      "floorplans.read",
      "branches.read",
      "reports.read",
      "analytics.read"
    ],
  },
  {
    code: "host_staff",
    name: "Host Staff",
    description: "Front desk reservation operations",
    isSystem: true,
    permissions: [
      "reservations.create",
      "reservations.read",
      "reservations.update",
      "reservations.cancel",
      "reservations.assign",
      "waitlist.read",
      "waitlist.manage",
      "waitlist.promote",
      "guests.create",
      "guests.read",
      "guests.update",
      "floorplans.read"
    ],
  },
  {
    code: "auditor",
    name: "Auditor",
    description: "Read-only audit and reporting access",
    isSystem: true,
    permissions: [
      "users.read",
      "roles.read",
      "reservations.read",
      "waitlist.read",
      "guests.read",
      "branches.read",
      "reports.read",
      "analytics.read",
      "audit.read",
      "security.read"
    ],
  }
];

async function seedPermissions() {
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        module: permission.module,
        action: permission.action,
        description: permission.description,
      },
      create: permission,
    });
  }

  console.log(`Permissions seeded: ${permissions.length}`);
}

async function seedRoles() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  if (tenants.length === 0) {
    console.log("No tenants found. Roles were not seeded.");
    return;
  }

  for (const tenant of tenants) {
    console.log(`Processing tenant: ${tenant.name} (${tenant.slug})`);

    for (const roleTemplate of roleTemplates) {
      const role = await prisma.role.upsert({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: roleTemplate.code,
          },
        },
        update: {
          name: roleTemplate.name,
          description: roleTemplate.description,
          isSystem: roleTemplate.isSystem,
        },
        create: {
          tenantId: tenant.id,
          code: roleTemplate.code,
          name: roleTemplate.name,
          description: roleTemplate.description,
          isSystem: roleTemplate.isSystem,
        },
      });

      const permissionRows = await prisma.permission.findMany({
        where: {
          code: { in: roleTemplate.permissions },
        },
        select: { id: true, code: true },
      });

      for (const permissionRow of permissionRows) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permissionRow.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permissionRow.id,
          },
        });
      }

      console.log(`Upserted role ${roleTemplate.code} with ${permissionRows.length} permissions.`);
    }
  }
}

async function main() {
  console.log("Seed started...");
  await seedPermissions();
  await seedRoles();
  console.log("Enterprise auth seed completed successfully.");
}

main()
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });