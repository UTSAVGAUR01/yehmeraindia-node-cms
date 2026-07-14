// Backward-compatible entry for hosting panels still configured with server/launcher.js.
// The root entry applies database, catalog and secure authentication preloads safely.
await import("../index.js");
