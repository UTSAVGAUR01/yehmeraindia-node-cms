// Compatibility entry point for Hostinger and other managed Node.js panels.
// Install application safeguards before starting the CMS.
import "./server/security-edge-preload.js";
import "./server/viewer-verification-preload.js";
import "./server/viewer-message-gate-preload.js";
import "./server/bilingual-place-preload.js";
import "./server/place-research-normalize-preload.js";
import "./server/book-collation-fix.js";
import "./server/hostinger-preload.js";
import "./server/footer-email-preload.js";
import "./server/security-auth-preload.js";
import "./server/member-studio-preload.js";
import "./server/profile-preload.js";
import "./server/social-footer-preload.js";
import "./server/work-description-ai-preload.js";
import "./server/index.js";
