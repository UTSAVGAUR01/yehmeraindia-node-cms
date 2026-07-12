import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { normalizeDatabaseEnvironment } from "./db-env.js";

normalizeDatabaseEnvironment();

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "index.js");
const dbSourcePath = path.join(here, "db.js");
const runtimePath = path.join(here, ".runtime-index.mjs");
const runtimeDbPath = path.join(here, ".runtime-db.mjs");
let source = fs.readFileSync(sourcePath, "utf8");
let dbSource = fs.readFileSync(dbSourcePath, "utf8");

const importMarker = 'import { initializeDatabase, query } from "./db.js";';
const middlewareMarker = 'app.use(express.json({ limit: "8mb" }));';

if (!source.includes(importMarker) || !source.includes(middlewareMarker)) {
  throw new Error("Unable to apply database/security bootstrap because server/index.js changed unexpectedly.");
}
if (!dbSource.includes("host: process.env.DB_HOST,")) {
  throw new Error("Unable to apply DB_PORT because server/db.js changed unexpectedly.");
}

dbSource = dbSource.replace(
  "host: process.env.DB_HOST,",
  "host: process.env.DB_HOST,\n  port: Number(process.env.DB_PORT || 3306),",
);
fs.writeFileSync(runtimeDbPath, dbSource, { mode: 0o600 });

source = source.replace(
  importMarker,
  'import { initializeDatabase, query } from "./db-runtime.js";\nimport { registerSecurityAuth } from "./security-auth.js";\nimport { registerDatabaseHealth } from "./db-health.js";',
);
source = source.replace(
  middlewareMarker,
  `${middlewareMarker}\nregisterSecurityAuth(app, { query, bcrypt, signToken, publicUser, requireAuth });\nregisterDatabaseHealth(app, query);`,
);
source = source.replace(
  'const databaseError =\n    String(error.code || "").startsWith("ER_") ||\n    ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(error.code);',
  'const databaseError = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNRESET", "PROTOCOL_CONNECTION_LOST"].includes(error.code);',
);

fs.writeFileSync(runtimePath, source, { mode: 0o600 });
process.once("exit", () => {
  for (const file of [runtimePath, runtimeDbPath]) {
    try { fs.unlinkSync(file); } catch {}
  }
});
await import(`${pathToFileURL(runtimePath).href}?v=${Date.now()}`);
