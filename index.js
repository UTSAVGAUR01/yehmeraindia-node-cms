// Compatibility entry point for Hostinger and other managed Node.js panels.
// Normalize database variables, install the collation-safe book update, then start the CMS.
import "./server/hostinger-preload.js";
import "./server/book-collation-fix.js";
import "./server/index.js";
