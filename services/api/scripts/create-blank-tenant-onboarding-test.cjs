const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv/config");

const NEW_TENANT_NAME = "Blank Restaurant Test";
const NEW_TENANT_SLUG_BASE = "blank-restaurant-test";
const NEW_RESTAURANT_NAME = "Blank Restaurant";
const NEW_BRANCH_NAME = "Main Branch";
const NEW_MANAGER_EMAIL_BASE = "manager.blank.test";

const DEMO_TENANT_ID = "cmnrwsh4d0001ocvljmz1e1tn";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const columnCache = new Map();

function makeId() {
  return "c" + crypto.randomBytes(12).toString("hex");
}

function qid(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

async function getColumns(client, tableName) {
  if (columnCache.has(tableName)) return columnCache.get(tableName);

  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position ASC
    `,
    [tableName]
  );

  const columns = result.rows.map((row) => row.column_name);
  columnCache.set(tableName, columns);
  return columns;
}

async function insertRow(client, tableName, data) {
  const columnsInTable = await getColumns(client, tableName);
  const now = new Date();
  const row = { ...data };

  if (columnsInTable.includes("id") && row.id === undefined) row.id = makeId();
  if (columnsInTable.includes("createdAt") && row.createdAt === undefined) row.createdAt = now;
  if (columnsInTable.includes("updatedAt") && row.updatedAt === undefined) row.updatedAt = now;

  const columns = Object.keys(row).filter(
    (key) => row[key] !== undefined && columnsInTable.includes(key)
  );

  const values = columns.map((key) => row[key]);
  const placeholders = columns.map((_, index) => `$${index + 1}`);

  const sql = `
    INSERT INTO ${qid(tableName)} (${columns.map(qid).join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING *
  `;

  const result = await client.query(sql, values);
  return result.rows[0];
}

async function makeUniqueSlug(client, baseSlug) {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await client.query(
      `SELECT ${qid("id")} FROM ${qid("Tenant")} WHERE ${qid("slug")} = $1 LIMIT 1`,
      [slug]
    );

    if (existing.rowCount === 0) return slug;

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

async function makeUniqueEmail(client, baseEmailName) {
  let email = `${baseEmailName}@demo.local`;
  let counter = 1;

  while (true) {
    const existing = await client.query(
      `SELECT ${qid("id")} FROM ${qid("User")} WHERE ${qid("email")} = $1 LIMIT 1`,
      [email]
    );

    if (existing.rowCount === 0) return email;

    counter += 1;
    email = `${baseEmailName}${counter}@demo.local`;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in C:\\restaurant-os\\services\\api\\.env");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const slug = await makeUniqueSlug(client, NEW_TENANT_SLUG_BASE);
    const email = await makeUniqueEmail(client, NEW_MANAGER_EMAIL_BASE);

    const tenant = await insertRow(client, "Tenant", {
      name: NEW_TENANT_NAME,
      slug,
      status: "TRIAL",
      timezone: "Europe/Belgrade",
      defaultLanguage: "en",
      currency: "EUR",
    });

    const restaurant = await insertRow(client, "Restaurant", {
      tenantId: tenant.id,
      name: NEW_RESTAURANT_NAME,
      legalName: null,
      logoFileId: null,
      phone: null,
      email: null,
      website: null,
      description: null,
    });

    const branch = await insertRow(client, "Branch", {
      tenantId: tenant.id,
      restaurantId: restaurant.id,
      name: NEW_BRANCH_NAME,
      code: "MAIN",
      addressLine1: "Center",
      addressLine2: null,
      city: "Prishtina",
      postalCode: null,
      country: "Kosovo",
      latitude: null,
      longitude: null,
      timezone: "Europe/Belgrade",
      currency: "EUR",
      phone: null,
      email: null,
      isActive: true,
    });

    await insertRow(client, "BranchSettings", {
      tenantId: tenant.id,
      branchId: branch.id,
      defaultReservationDurationMin: 90,
      tableTurnoverBufferMin: 15,
      maxPartySize: 10,
      allowOnlineBooking: true,
      allowWalkIns: true,
      allowPhoneReservations: true,
      requireGuestPhone: true,
      requireGuestEmail: false,
      reservationLeadTimeMin: 0,
      reservationCutoffMin: 0,
      localeJson: null,
      allowIndoorOnline: true,
      allowTerraceOnline: true,
      defaultOnlineZoneId: null,
      maxOnlineGuestsPerDay: 30,
      totalSeatingCapacity: 0,
      emailSenderEmail: null,
      emailSenderName: null,
      googleReviewLink: null,
      logoUrl: null,
      reviewDelayMinutes: 60,
    });

    const businessHours = [
      [1, "11:00", "15:00", "LUNCH"],
      [1, "18:00", "23:00", "DINNER"],
      [2, "11:00", "15:00", "LUNCH"],
      [2, "18:00", "23:00", "DINNER"],
      [3, "11:00", "15:00", "LUNCH"],
      [3, "18:00", "23:00", "DINNER"],
      [4, "11:00", "15:00", "LUNCH"],
      [4, "18:00", "23:00", "DINNER"],
      [5, "11:00", "15:00", "LUNCH"],
      [5, "18:00", "23:00", "DINNER"],
      [6, "11:00", "15:00", "LUNCH"],
      [6, "18:00", "23:00", "DINNER"],
      [7, "11:00", "15:00", "LUNCH"],
    ];

    for (const [dayOfWeek, openTime, closeTime, serviceType] of businessHours) {
      await insertRow(client, "BusinessHour", {
        tenantId: tenant.id,
        branchId: branch.id,
        dayOfWeek,
        openTime,
        closeTime,
        isClosed: false,
        serviceType,
      });
    }

    const floorPlan = await insertRow(client, "FloorPlan", {
      tenantId: tenant.id,
      branchId: branch.id,
      name: "Main Floor",
      version: 1,
      canvasWidth: 1920,
      canvasHeight: 1080,
      isActive: true,
    });

    const demoRolesResult = await client.query(
      `
        SELECT *
        FROM ${qid("Role")}
        WHERE ${qid("tenantId")} = $1
        ORDER BY ${qid("createdAt")} ASC
      `,
      [DEMO_TENANT_ID]
    );

    const roleMap = new Map();

    for (const role of demoRolesResult.rows) {
      const newRole = await insertRow(client, "Role", {
        tenantId: tenant.id,
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      });

      roleMap.set(role.id, newRole.id);
    }

    let rolePermissionsCreated = 0;

    for (const [oldRoleId, newRoleId] of roleMap.entries()) {
      const rolePermissionsResult = await client.query(
        `
          SELECT ${qid("permissionId")}
          FROM ${qid("RolePermission")}
          WHERE ${qid("roleId")} = $1
          ORDER BY ${qid("id")} ASC
        `,
        [oldRoleId]
      );

      for (const rp of rolePermissionsResult.rows) {
        await insertRow(client, "RolePermission", {
          roleId: newRoleId,
          permissionId: rp.permissionId,
        });

        rolePermissionsCreated += 1;
      }
    }

    const demoManagerResult = await client.query(
      `
        SELECT *
        FROM ${qid("User")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("email")} = $2
        LIMIT 1
      `,
      [DEMO_TENANT_ID, "manager@demo.com"]
    );

    if (demoManagerResult.rowCount !== 1) {
      throw new Error("Demo manager user not found.");
    }

    const manager = await insertRow(client, "User", {
      tenantId: tenant.id,
      employeeId: null,
      email,
      passwordHash: demoManagerResult.rows[0].passwordHash,
      status: "ACTIVE",
      lastLoginAt: null,
    });

    const branchManagerRole = await client.query(
      `
        SELECT ${qid("id")}
        FROM ${qid("Role")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("code")} = $2
        LIMIT 1
      `,
      [tenant.id, "branch_manager"]
    );

    await insertRow(client, "UserRole", {
      userId: manager.id,
      roleId: branchManagerRole.rows[0].id,
      branchId: branch.id,
    });

    await client.query("COMMIT");

    console.log("");
    console.log("BLANK TENANT CREATED");
    console.log(JSON.stringify({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
      },
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },
      floorPlan: {
        id: floorPlan.id,
        name: floorPlan.name,
      },
      manager: {
        id: manager.id,
        email: manager.email,
        note: "Password hash copied from manager@demo.com for local smoke test.",
      },
      copied: {
        businessHours: businessHours.length,
        roles: roleMap.size,
        rolePermissions: rolePermissionsCreated,
        tables: 0,
        zones: 0,
        combinations: 0,
      },
      browserLocalStorage: {
        tenantId: tenant.id,
        branchId: branch.id,
      },
    }, null, 2));

    console.log("");
    console.log("Browser localStorage:");
    console.log(`localStorage.setItem("tenantId", "${tenant.id}");`);
    console.log(`localStorage.setItem("branchId", "${branch.id}");`);
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("FAILED - ROLLED BACK:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();