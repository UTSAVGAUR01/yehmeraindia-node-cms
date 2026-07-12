// Stable Hostinger entry point.
// Normalize database variables first, then start the actual Express server.
import { normalizeDatabaseEnvironment } from "./server/db-env.js";

normalizeDatabaseEnvironment();
await import("./server/index.js");
