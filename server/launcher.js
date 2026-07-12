import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(here, "index.js");
const runtimePath = path.join(here, ".runtime-index.mjs");
let source = fs.readFileSync(sourcePath, "utf8");

const importMarker = 'import { initializeDatabase, query } from "./db.js";';
const middlewareMarker = 'app.use(express.json({ limit: "8mb" }));';

if (!source.includes(importMarker) || !source.includes(middlewareMarker)) {
  throw new Error("Unable to apply security bootstrap because server/index.js changed unexpectedly.");
}

source = source.replace(
  importMarker,
  `${importMarker}\nimport { registerSecurityAuth } from "./security-auth.js";`,
);
source = source.replace(
  middlewareMarker,
  `${middlewareMarker}\nregisterSecurityAuth(app, { query, bcrypt, signToken, publicUser, requireAuth });`,
);

fs.writeFileSync(runtimePath, source, { mode: 0o600 });
process.once("exit", () => {
  try { fs.unlinkSync(runtimePath); } catch {}
});
await import(`${pathToFileURL(runtimePath).href}?v=${Date.now()}`);
