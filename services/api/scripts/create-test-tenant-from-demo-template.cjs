const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv/config");

const DEMO_TENANT_ID = "cmnrwsh4d0001ocvljmz1e1tn";
const DEMO_BRANCH_ID = "cmnrwsh4q0003ocvl9azqxrr0";

const NEW_TENANT_NAME = "Antica Template Test";
const NEW_TENANT_SLUG_BASE = "antica-template-test";
const NEW_RESTAURANT_NAME = "Restaurant Antica Test";
const NEW_BRANCH_NAME = "Main Branch";
const NEW_MANAGER_EMAIL_BASE = "manager.antica.test";

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

function omit(row, keys) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    if (!keys.includes(key)) out[key] = value;
  }
  return out;
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
  const row = { ...data };
  const now = new Date();

  if (columnsInTable.includes("id") && row.id === undefined) {
    row.id = makeId();
  }

  if (columnsInTable.includes("createdAt") && row.createdAt === undefined) {
    row.createdAt = now;
  }

  if (columnsInTable.includes("updatedAt") && row.updatedAt === undefined) {
    row.updatedAt = now;
  }

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

    const demoTenantResult = await client.query(
      `SELECT * FROM ${qid("Tenant")} WHERE ${qid("id")} = $1`,
      [DEMO_TENANT_ID]
    );

    if (demoTenantResult.rowCount !== 1) {
      throw new Error(`Demo tenant not found: ${DEMO_TENANT_ID}`);
    }

    const demoRestaurantResult = await client.query(
      `
        SELECT *
        FROM ${qid("Restaurant")}
        WHERE ${qid("tenantId")} = $1
        ORDER BY ${qid("createdAt")} ASC
        LIMIT 1
      `,
      [DEMO_TENANT_ID]
    );

    if (demoRestaurantResult.rowCount !== 1) {
      throw new Error("Demo restaurant not found.");
    }

    const demoBranchResult = await client.query(
      `
        SELECT *
        FROM ${qid("Branch")}
        WHERE ${qid("id")} = $1
          AND ${qid("tenantId")} = $2
      `,
      [DEMO_BRANCH_ID, DEMO_TENANT_ID]
    );

    if (demoBranchResult.rowCount !== 1) {
      throw new Error(`Demo branch not found: ${DEMO_BRANCH_ID}`);
    }

    const demoSettingsResult = await client.query(
      `
        SELECT *
        FROM ${qid("BranchSettings")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
        LIMIT 1
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID]
    );

    if (demoSettingsResult.rowCount !== 1) {
      throw new Error("Demo branch settings not found.");
    }

    const uniqueSlug = await makeUniqueSlug(client, NEW_TENANT_SLUG_BASE);
    const uniqueEmail = await makeUniqueEmail(client, NEW_MANAGER_EMAIL_BASE);

    const newTenant = await insertRow(client, "Tenant", {
      ...omit(demoTenantResult.rows[0], ["id", "name", "slug", "createdAt", "updatedAt"]),
      name: NEW_TENANT_NAME,
      slug: uniqueSlug,
    });

    const newRestaurant = await insertRow(client, "Restaurant", {
      ...omit(demoRestaurantResult.rows[0], ["id", "tenantId", "name", "createdAt", "updatedAt"]),
      tenantId: newTenant.id,
      name: NEW_RESTAURANT_NAME,
    });

    const newBranch = await insertRow(client, "Branch", {
      ...omit(demoBranchResult.rows[0], ["id", "tenantId", "restaurantId", "name", "createdAt", "updatedAt"]),
      tenantId: newTenant.id,
      restaurantId: newRestaurant.id,
      name: NEW_BRANCH_NAME,
    });

    await insertRow(client, "BranchSettings", {
      ...omit(demoSettingsResult.rows[0], ["id", "tenantId", "branchId", "createdAt", "updatedAt"]),
      tenantId: newTenant.id,
      branchId: newBranch.id,
      defaultOnlineZoneId: null,
    });

    const businessHoursResult = await client.query(
      `
        SELECT *
        FROM ${qid("BusinessHour")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
        ORDER BY ${qid("dayOfWeek")} ASC, ${qid("serviceType")} ASC, ${qid("openTime")} ASC
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID]
    );

    let businessHoursCreated = 0;

    for (const row of businessHoursResult.rows) {
      await insertRow(client, "BusinessHour", {
        ...omit(row, ["id", "tenantId", "branchId", "createdAt", "updatedAt"]),
        tenantId: newTenant.id,
        branchId: newBranch.id,
      });

      businessHoursCreated += 1;
    }

    const demoFloorPlanResult = await client.query(
      `
        SELECT *
        FROM ${qid("FloorPlan")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
          AND ${qid("isActive")} = true
        ORDER BY ${qid("createdAt")} ASC
        LIMIT 1
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID]
    );

    if (demoFloorPlanResult.rowCount !== 1) {
      throw new Error("Active demo floor plan not found.");
    }

    const demoFloorPlan = demoFloorPlanResult.rows[0];

    const newFloorPlan = await insertRow(client, "FloorPlan", {
      ...omit(demoFloorPlan, ["id", "tenantId", "branchId", "createdAt", "updatedAt"]),
      tenantId: newTenant.id,
      branchId: newBranch.id,
    });

    const zoneMap = new Map();

    const demoZonesResult = await client.query(
      `
        SELECT *
        FROM ${qid("Zone")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
          AND ${qid("floorPlanId")} = $3
          AND ${qid("isActive")} = true
        ORDER BY ${qid("sortOrder")} ASC, ${qid("createdAt")} ASC
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID, demoFloorPlan.id]
    );

    for (const row of demoZonesResult.rows) {
      const newZone = await insertRow(client, "Zone", {
        ...omit(row, ["id", "tenantId", "branchId", "floorPlanId", "createdAt", "updatedAt"]),
        tenantId: newTenant.id,
        branchId: newBranch.id,
        floorPlanId: newFloorPlan.id,
      });

      zoneMap.set(row.id, newZone.id);
    }

    const tableMap = new Map();

    const demoTablesResult = await client.query(
      `
        SELECT *
        FROM ${qid("RestaurantTable")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
          AND ${qid("floorPlanId")} = $3
          AND ${qid("isActive")} = true
        ORDER BY ${qid("code")} ASC, ${qid("createdAt")} ASC
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID, demoFloorPlan.id]
    );

    for (const row of demoTablesResult.rows) {
      const newZoneId = zoneMap.get(row.zoneId);

      if (!newZoneId) {
        console.log(`SKIP TABLE WITHOUT VALID ZONE: ${row.code}`);
        continue;
      }

      const newTable = await insertRow(client, "RestaurantTable", {
        ...omit(row, ["id", "tenantId", "branchId", "zoneId", "floorPlanId", "createdAt", "updatedAt"]),
        tenantId: newTenant.id,
        branchId: newBranch.id,
        zoneId: newZoneId,
        floorPlanId: newFloorPlan.id,
      });

      tableMap.set(row.id, newTable.id);
    }

    let combinationsCreated = 0;
    let combinationsSkipped = 0;
    let combinationItemsCreated = 0;

    const demoCombinationsResult = await client.query(
      `
        SELECT *
        FROM ${qid("TableCombination")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("branchId")} = $2
          AND ${qid("isActive")} = true
        ORDER BY ${qid("createdAt")} ASC
      `,
      [DEMO_TENANT_ID, DEMO_BRANCH_ID]
    );

    for (const combo of demoCombinationsResult.rows) {
      const itemsResult = await client.query(
        `
          SELECT *
          FROM ${qid("TableCombinationItem")}
          WHERE ${qid("combinationId")} = $1
          ORDER BY ${qid("sortOrder")} ASC
        `,
        [combo.id]
      );

      const validItems = itemsResult.rows.filter((item) => tableMap.has(item.tableId));

      if (validItems.length < 2) {
        console.log(`SKIP INVALID COMBINATION: ${combo.name} / valid items: ${validItems.length}`);
        combinationsSkipped += 1;
        continue;
      }

      const newCombo = await insertRow(client, "TableCombination", {
        ...omit(combo, ["id", "tenantId", "branchId", "createdAt", "updatedAt"]),
        tenantId: newTenant.id,
        branchId: newBranch.id,
      });

      combinationsCreated += 1;

      for (const item of validItems) {
        await insertRow(client, "TableCombinationItem", {
          ...omit(item, ["id", "combinationId", "tableId", "createdAt", "updatedAt"]),
          combinationId: newCombo.id,
          tableId: tableMap.get(item.tableId),
        });

        combinationItemsCreated += 1;
      }
    }

    const roleMap = new Map();

    const demoRolesResult = await client.query(
      `
        SELECT *
        FROM ${qid("Role")}
        WHERE ${qid("tenantId")} = $1
        ORDER BY ${qid("createdAt")} ASC
      `,
      [DEMO_TENANT_ID]
    );

    for (const role of demoRolesResult.rows) {
      const newRole = await insertRow(client, "Role", {
        ...omit(role, ["id", "tenantId", "createdAt"]),
        tenantId: newTenant.id,
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

    const newManager = await insertRow(client, "User", {
      ...omit(demoManagerResult.rows[0], ["id", "tenantId", "employeeId", "email", "lastLoginAt", "createdAt", "updatedAt"]),
      tenantId: newTenant.id,
      employeeId: null,
      email: uniqueEmail,
      lastLoginAt: null,
    });

    const branchManagerRoleResult = await client.query(
      `
        SELECT ${qid("id")}
        FROM ${qid("Role")}
        WHERE ${qid("tenantId")} = $1
          AND ${qid("code")} = $2
        LIMIT 1
      `,
      [newTenant.id, "branch_manager"]
    );

    if (branchManagerRoleResult.rowCount !== 1) {
      throw new Error("New branch_manager role not found.");
    }

    await insertRow(client, "UserRole", {
      userId: newManager.id,
      roleId: branchManagerRoleResult.rows[0].id,
      branchId: newBranch.id,
    });

    await client.query("COMMIT");

    const summary = {
      tenant: {
        id: newTenant.id,
        name: newTenant.name,
        slug: newTenant.slug,
      },
      restaurant: {
        id: newRestaurant.id,
        name: newRestaurant.name,
      },
      branch: {
        id: newBranch.id,
        name: newBranch.name,
        code: newBranch.code,
      },
      manager: {
        id: newManager.id,
        email: newManager.email,
        note: "Password hash copied from manager@demo.com for local smoke test.",
      },
      copied: {
        businessHours: businessHoursCreated,
        zones: zoneMap.size,
        tables: tableMap.size,
        combinationsCreated,
        combinationsSkipped,
        combinationItems: combinationItemsCreated,
        roles: roleMap.size,
        rolePermissions: rolePermissionsCreated,
      },
      localStorageForBrowserTest: {
        tenantId: newTenant.id,
        branchId: newBranch.id,
      },
    };

    console.log("");
    console.log("TEST TENANT CREATED FROM DEMO TEMPLATE");
    console.log(JSON.stringify(summary, null, 2));
    console.log("");
    console.log("Browser localStorage:");
    console.log(`localStorage.setItem("tenantId", "${newTenant.id}");`);
    console.log(`localStorage.setItem("branchId", "${newBranch.id}");`);
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