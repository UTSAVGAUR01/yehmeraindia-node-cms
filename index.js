// Compatibility entry point for Hostinger and other managed Node.js panels.
// The preload normalizes database variables and adds a non-blocking health route.
import "./server/hostinger-preload.js";
import "./server/index.js";
