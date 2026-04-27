const { Pool } = require("pg");
require("dotenv/config");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const tenants = await pool.query(`
    SELECT
      t."id",
      t."name",
      t."slug",
      t."createdAt"
    FROM "Tenant" t
    ORDER BY t."createdAt" DESC
    LIMIT 10
  `);

  console.log("");
  console.log("LATEST TENANTS:");
  console.table(tenants.rows);

  const branches = await pool.query(`
    SELECT
      t."name" AS "tenantName",
      t."slug" AS "tenantSlug",
      b."id" AS "branchId",
      b."name" AS "branchName",
      b."city",
      b."country",
      COUNT(rt."id")::int AS "tablesCount",
      COUNT(z."id")::int AS "zonesJoinCount"
    FROM "Tenant" t
    JOIN "Branch" b ON b."tenantId" = t."id"
    LEFT JOIN "RestaurantTable" rt ON rt."tenantId" = t."id" AND rt."branchId" = b."id"
    LEFT JOIN "Zone" z ON z."tenantId" = t."id" AND z."branchId" = b."id"
    GROUP BY t."name", t."slug", b."id", b."name", b."city", b."country"
    ORDER BY MAX(t."createdAt") DESC
    LIMIT 20
  `);

  console.log("");
  console.log("BRANCH TABLE COUNTS:");
  console.table(branches.rows);

  const tables = await pool.query(`
    SELECT
      t."name" AS "tenantName",
      t."slug" AS "tenantSlug",
      b."name" AS "branchName",
      rt."code",
      rt."name",
      rt."capacityMin",
      rt."capacityMax",
      rt."createdAt"
    FROM "RestaurantTable" rt
    JOIN "Tenant" t ON t."id" = rt."tenantId"
    JOIN "Branch" b ON b."id" = rt."branchId"
    WHERE rt."code" = 'T7'
    ORDER BY rt."createdAt" DESC
  `);

  console.log("");
  console.log("WHERE IS T7 CREATED:");
  console.table(tables.rows);
}

main()
  .catch((error) => {
    console.error("FAILED:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });