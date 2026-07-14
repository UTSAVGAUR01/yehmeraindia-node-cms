// Compatibility entry point for Hostinger and other managed Node.js panels.
// Install runtime safeguards before starting the CMS.
import "./server/book-collation-fix.js";
import "./server/hostinger-preload.js";
import "./server/security-auth-preload.js";
import "./server/member-studio-preload.js";
import "./server/index.js";
