// Compatibility entry point for Hostinger and other managed Node.js panels.
// Normalize database values, repair catalog tables, then start the existing CMS.
import "./server/hostinger-preload.js";
import { ensureCatalogSchema } from "./server/catalog-schema.js";

await ensureCatalogSchema().catch((error) => {
  // Never take down the public website because a migration failed.
  console.error("Catalog schema repair failed:", error.code || error.message);
});

await import("./server/index.js");
