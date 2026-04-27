const { Pool } = require("pg");
require("dotenv/config");

const DEMO_TENANT_ID = "cmnrwsh4d0001ocvljmz1e1tn";
const DEMO_BRANCH_ID = "cmnrwsh4q0003ocvl9azqxrr0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function qid(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function redactRow(row) {
  const clean = {};
  for (const [key, value] of Object.entries(row)) {
    const lower = key.toLowerCase();
    if (
      lower.includes("password") ||
      lower.includes("hash") ||
      lower.includes("token") ||
      lower.includes("secret")
    ) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

async function getTables() {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name ASC
  `);

  const map = new Map();
  for (const row of result.rows) {
    map.set(row.table_name.toLowerCase(), row.table_name);
  }
  return map;
}

async function getColumns(tableName) {
  const result = await pool.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position ASC
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
}

function resolveTable(tableMap, candidates) {
  for (const candidate of candidates) {
    const found = tableMap.get(candidate.toLowerCase());
    if (found) return found;
  }
  return null;
}

async function countRows(tableName, whereSql, params) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM ${qid(tableName)} WHERE ${whereSql}`,
    params
  );
  return result.rows[0]?.count ?? 0;
}

async function selectRows(tableName, columns, whereSql, params, limit = 300) {
  let orderBy = "";
  if (columns.includes("createdAt")) {
    orderBy = ` ORDER BY ${qid("createdAt")} ASC`;
  } else if (columns.includes("id")) {
    orderBy = ` ORDER BY ${qid("id")} ASC`;
  }

  const result = await pool.query(
    `SELECT * FROM ${qid(tableName)} WHERE ${whereSql}${orderBy} LIMIT ${Number(limit)}`,
    params
  );

  return result.rows.map(redactRow);
}

async function pullExact(report, key, tableMap, candidates, idValue) {
  const tableName = resolveTable(tableMap, candidates);
  if (!tableName) {
    report.sections[key] = { exists: false, table: null, count: 0, rows: [] };
    return [];
  }

  const columns = await getColumns(tableName);
  if (!columns.includes("id")) {
    report.sections[key] = { exists: true, table: tableName, columns, count: 0, rows: [], warning: "No id column found." };
    return [];
  }

  const whereSql = `${qid("id")} = $1`;
  const count = await countRows(tableName, whereSql, [idValue]);
  const rows = await selectRows(tableName, columns, whereSql, [idValue]);

  report.sections[key] = { exists: true, table: tableName, columns, count, rows };
  return rows;
}

async function pullByTenant(report, key, tableMap, candidates) {
  const tableName = resolveTable(tableMap, candidates);
  if (!tableName) {
    report.sections[key] = { exists: false, table: null, count: 0, rows: [] };
    return [];
  }

  const columns = await getColumns(tableName);
  if (!columns.includes("tenantId")) {
    report.sections[key] = { exists: true, table: tableName, columns, count: 0, rows: [], warning: "No tenantId column found." };
    return [];
  }

  const whereSql = `${qid("tenantId")} = $1`;
  const count = await countRows(tableName, whereSql, [DEMO_TENANT_ID]);
  const rows = await selectRows(tableName, columns, whereSql, [DEMO_TENANT_ID]);

  report.sections[key] = { exists: true, table: tableName, columns, count, rows };
  return rows;
}

async function pullByBranch(report, key, tableMap, candidates) {
  const tableName = resolveTable(tableMap, candidates);
  if (!tableName) {
    report.sections[key] = { exists: false, table: null, count: 0, rows: [] };
    return [];
  }

  const columns = await getColumns(tableName);

  let whereSql = null;
  let params = [];

  if (columns.includes("tenantId") && columns.includes("branchId")) {
    whereSql = `${qid("tenantId")} = $1 AND ${qid("branchId")} = $2`;
    params = [DEMO_TENANT_ID, DEMO_BRANCH_ID];
  } else if (columns.includes("branchId")) {
    whereSql = `${qid("branchId")} = $1`;
    params = [DEMO_BRANCH_ID];
  } else if (columns.includes("tenantId")) {
    whereSql = `${qid("tenantId")} = $1`;
    params = [DEMO_TENANT_ID];
  } else {
    report.sections[key] = {
      exists: true,
      table: tableName,
      columns,
      count: 0,
      rows: [],
      warning: "No tenantId or branchId column found."
    };
    return [];
  }

  const count = await countRows(tableName, whereSql, params);
  const rows = await selectRows(tableName, columns, whereSql, params);

  report.sections[key] = { exists: true, table: tableName, columns, count, rows };
  return rows;
}

async function pullByIdList(report, key, tableMap, candidates, columnName, ids) {
  const tableName = resolveTable(tableMap, candidates);
  if (!tableName) {
    report.sections[key] = { exists: false, table: null, count: 0, rows: [] };
    return [];
  }

  const columns = await getColumns(tableName);

  if (!columns.includes(columnName)) {
    report.sections[key] = {
      exists: true,
      table: tableName,
      columns,
      count: 0,
      rows: [],
      warning: `No ${columnName} column found.`
    };
    return [];
  }

  if (!ids.length) {
    report.sections[key] = {
      exists: true,
      table: tableName,
      columns,
      count: 0,
      rows: [],
      warning: `No source ids found for ${columnName}.`
    };
    return [];
  }

  const whereSql = `${qid(columnName)} = ANY($1::text[])`;
  const count = await countRows(tableName, whereSql, [ids]);
  const rows = await selectRows(tableName, columns, whereSql, [ids]);

  report.sections[key] = { exists: true, table: tableName, columns, count, rows };
  return rows;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in C:\\restaurant-os\\services\\api\\.env");
  }

  const tableMap = await getTables();

  const report = {
    generatedAt: new Date().toISOString(),
    demoTenantId: DEMO_TENANT_ID,
    demoBranchId: DEMO_BRANCH_ID,
    purpose: "Inspect demo tenant template data for new tenant provisioning.",
    sections: {},
    templateCopyDecision: {
      shouldCopyToNewTenant: [
        "Restaurant",
        "Branch",
        "BranchSettings",
        "BusinessHour",
        "DayOverride if it is a default template rule",
        "FloorPlan",
        "Zone",
        "ZoneAvailabilityRule",
        "RestaurantTable",
        "TableCombination",
        "TableCombinationItem",
        "BookingPolicy",
        "BookingRule",
        "Manager/owner user bootstrap",
        "Roles",
        "Permissions",
        "UserRole bootstrap"
      ],
      shouldNotCopyToNewTenant: [
        "Reservation",
        "ReservationStatusHistory",
        "ReservationAssignmentLog",
        "Guest",
        "GuestProfile",
        "GuestNote",
        "GuestVisit",
        "WaitlistEntry",
        "SecurityEvent",
        "AuditLog",
        "LoginSession",
        "Operational notification logs"
      ]
    }
  };

  const tenantRows = await pullExact(report, "tenant", tableMap, ["Tenant"], DEMO_TENANT_ID);
  const restaurantRows = await pullByTenant(report, "restaurants", tableMap, ["Restaurant"]);
  const branchRows = await pullByTenant(report, "branches", tableMap, ["Branch"]);
  const branchSettingsRows = await pullByBranch(report, "branchSettings", tableMap, ["BranchSettings", "BranchSetting"]);
  const businessHourRows = await pullByBranch(report, "businessHours", tableMap, ["BusinessHour", "BusinessHours"]);
  const dayOverrideRows = await pullByBranch(report, "dayOverrides", tableMap, ["DayOverride", "DayOverrides"]);

  const floorPlanRows = await pullByBranch(report, "floorPlans", tableMap, ["FloorPlan"]);
  const zoneRows = await pullByBranch(report, "zones", tableMap, ["Zone"]);
  const zoneIds = zoneRows.map((row) => row.id).filter(Boolean);
  const floorPlanIds = floorPlanRows.map((row) => row.id).filter(Boolean);

  const zoneAvailabilityRows = await pullByIdList(
    report,
    "zoneAvailabilityRules",
    tableMap,
    ["ZoneAvailabilityRule"],
    "zoneId",
    zoneIds
  );

  const tableRows = await pullByBranch(report, "tables", tableMap, ["RestaurantTable"]);
  const tableIds = tableRows.map((row) => row.id).filter(Boolean);

  const tableCombinationRows = await pullByBranch(report, "tableCombinations", tableMap, ["TableCombination"]);
  const combinationIds = tableCombinationRows.map((row) => row.id).filter(Boolean);

  const tableCombinationItemRows = await pullByIdList(
    report,
    "tableCombinationItems",
    tableMap,
    ["TableCombinationItem"],
    "combinationId",
    combinationIds
  );

  const layoutLabelRows = await pullByIdList(
    report,
    "layoutLabelsByFloorPlan",
    tableMap,
    ["LayoutLabel", "LayoutLabels"],
    "floorPlanId",
    floorPlanIds
  );

  const bookingPolicyRows = await pullByBranch(report, "bookingPolicies", tableMap, ["BookingPolicy"]);
  const policyIds = bookingPolicyRows.map((row) => row.id).filter(Boolean);

  const bookingRuleRows = await pullByIdList(
    report,
    "bookingRules",
    tableMap,
    ["BookingRule"],
    "policyId",
    policyIds
  );

  const userRows = await pullByTenant(report, "users", tableMap, ["User"]);
  const userIds = userRows.map((row) => row.id).filter(Boolean);

  const roleRows = await pullByTenant(report, "roles", tableMap, ["Role"]);
  const roleIds = roleRows.map((row) => row.id).filter(Boolean);

  const userRoleRows = await pullByIdList(
    report,
    "userRoles",
    tableMap,
    ["UserRole"],
    "userId",
    userIds
  );

  const rolePermissionRows = await pullByIdList(
    report,
    "rolePermissions",
    tableMap,
    ["RolePermission"],
    "roleId",
    roleIds
  );

  const permissionRows = await pullByIdList(
    report,
    "permissionsUsedByRoles",
    tableMap,
    ["Permission"],
    "id",
    rolePermissionRows.map((row) => row.permissionId).filter(Boolean)
  );

  await pullByBranch(report, "reservations_count_only_check", tableMap, ["Reservation"]);
  await pullByTenant(report, "guests_count_only_check", tableMap, ["Guest"]);
  await pullByBranch(report, "waitlist_count_only_check", tableMap, ["WaitlistEntry"]);

  const counts = {};
  for (const [key, section] of Object.entries(report.sections)) {
    counts[key] = {
      table: section.table,
      exists: section.exists,
      count: section.count,
      warning: section.warning || null
    };
  }

  report.counts = counts;

  const outputPath = "C:\\restaurant-os\\services\\api\\scripts\\demo-template-report.json";
  const fs = require("fs");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

  console.log("");
  console.log("DEMO TEMPLATE REPORT GENERATED");
  console.log("Tenant:", DEMO_TENANT_ID);
  console.log("Branch:", DEMO_BRANCH_ID);
  console.log("Output:", outputPath);
  console.log("");
  console.log("COUNTS:");
  console.log(JSON.stringify(counts, null, 2));
  console.log("");
  console.log("Send me this file content or paste the COUNTS output first:");
  console.log(outputPath);
}

main()
  .catch((error) => {
    console.error("FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });