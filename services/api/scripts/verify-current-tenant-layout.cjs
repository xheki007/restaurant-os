const { Pool } = require("pg");
require("dotenv/config");

const TENANT_SLUG = "antica-real-test-1";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query(`
    SELECT
      t."name" AS "tenantName",
      t."slug" AS "tenantSlug",
      b."id" AS "branchId",
      b."name" AS "branchName",
      b."city",
      b."country",
      fp."id" AS "floorPlanId",
      fp."name" AS "floorPlanName",
      z."code" AS "zoneCode",
      z."name" AS "zoneName",
      rt."code" AS "tableCode",
      rt."name" AS "tableName",
      rt."capacityMin",
      rt."capacityMax",
      rt."createdAt"
    FROM "Tenant" t
    JOIN "Branch" b ON b."tenantId" = t."id"
    LEFT JOIN "FloorPlan" fp ON fp."tenantId" = t."id" AND fp."branchId" = b."id"
    LEFT JOIN "Zone" z ON z."tenantId" = t."id" AND z."branchId" = b."id" AND z."floorPlanId" = fp."id"
    LEFT JOIN "RestaurantTable" rt ON rt."tenantId" = t."id" AND rt."branchId" = b."id" AND rt."floorPlanId" = fp."id"
    WHERE t."slug" = $1
    ORDER BY rt."createdAt" ASC NULLS LAST
  `, [TENANT_SLUG]);

  console.log("");
  console.log("CURRENT TENANT LAYOUT:");
  console.table(result.rows);

  const counts = await pool.query(`
    SELECT
      t."slug" AS "tenantSlug",
      COUNT(DISTINCT z."id")::int AS "zones",
      COUNT(DISTINCT rt."id")::int AS "tables"
    FROM "Tenant" t
    JOIN "Branch" b ON b."tenantId" = t."id"
    LEFT JOIN "Zone" z ON z."tenantId" = t."id" AND z."branchId" = b."id"
    LEFT JOIN "RestaurantTable" rt ON rt."tenantId" = t."id" AND rt."branchId" = b."id"
    WHERE t."slug" = $1
    GROUP BY t."slug"
  `, [TENANT_SLUG]);

  console.log("");
  console.log("COUNTS:");
  console.table(counts.rows);
}

main()
  .catch((error) => {
    console.error("FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });