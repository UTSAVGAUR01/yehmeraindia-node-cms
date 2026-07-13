// Compatibility entry point for Hostinger and other managed Node.js panels.
// Install the collation-safe book handler first, normalize database variables, then start the CMS.
import "./server/book-collation-fix.js";
import "./server/hostinger-preload.js";
import "./server/index.js";
