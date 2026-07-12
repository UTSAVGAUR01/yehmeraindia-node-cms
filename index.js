// Compatibility entry point for hosting panels that require a root-level file.
// Always load the hardened launcher so database normalization, OTP routes,
// and the database health endpoint are registered in every deployment mode.
import "./server/launcher.js";
