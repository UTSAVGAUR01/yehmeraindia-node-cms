import express from "express";
import jwt from "jsonwebtoken";
import { query } from "./db.js";

let installed = false;
let installing = false;

function install(app) {
  if (installed || installing) return;
  installing = true;

  app.use(async (req, res, next) => {
    const pathname = String(req.path || "").toLowerCase();
    if (req.method !== "POST" || !/^\/api\/posts\/[^/]+\/messages$/.test(pathname)) return next();

    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token || !process.env.JWT_SECRET) return res.status(401).json({ message: "Sign in required." });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const rows = await query(
        "SELECT id, role, status, email, email_verified_at, registration_pending FROM users WHERE id = ? LIMIT 1",
        [decoded.id],
      );
      const user = rows[0];
      if (!user || user.status !== "active") return res.status(401).json({ message: "This account is not active." });
      if (user.role === "viewer" && (!user.email_verified_at || Boolean(user.registration_pending))) {
        return res.status(403).json({
          message: "Verify your email with a one-time code before sending messages to an author.",
          code: "EMAIL_VERIFICATION_REQUIRED",
          verificationRequired: true,
          email: user.email,
        });
      }
      next();
    } catch (error) {
      if (["JsonWebTokenError", "TokenExpiredError"].includes(error.name)) {
        return res.status(401).json({ message: "Session expired. Please sign in again." });
      }
      next(error);
    }
  });

  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function viewerMessageGateAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") install(this);
  return result;
};
