// Stable Hostinger entry point.
// Apply database defaults without throwing so the public website can start
// even when MySQL is temporarily unavailable or a variable is incomplete.
import { applyDatabaseDefaults } from "./server/db-env-safe.js";

applyDatabaseDefaults();
await import("./server/index.js");
