import express from "express";
import { query } from "./db.js";

const SUPPORT_EMAIL = "support@yehmeraindia.com";
const LEGACY_EMAIL = "hello@yehmeraindia.com";
let repairPromise = null;

function shouldUseSupportEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return !email || email === LEGACY_EMAIL;
}

function normalizeHomepagePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  if (!shouldUseSupportEmail(payload.contactEmail)) return payload;
  return { ...payload, contactEmail: SUPPORT_EMAIL };
}

async function repairLegacyFooterEmail() {
  if (!repairPromise) {
    repairPromise = query(
      `UPDATE homepage_content
          SET contact_email = ?
        WHERE id = 1
          AND (contact_email IS NULL OR TRIM(contact_email) = '' OR LOWER(TRIM(contact_email)) = ?)`,
      [SUPPORT_EMAIL, LEGACY_EMAIL],
    ).catch((error) => {
      repairPromise = null;
      console.warn("Footer email repair deferred:", error.code || error.message);
    });
  }
  await repairPromise;
}

const originalGet = express.application.get;

express.application.get = function footerEmailAwareGet(path, ...handlers) {
  if (path !== "/api/homepage" || handlers.length === 0) {
    return originalGet.call(this, path, ...handlers);
  }

  const normalizeFooterEmail = async (_req, res, next) => {
    await repairLegacyFooterEmail();
    const originalJson = res.json.bind(res);
    res.json = (payload) => originalJson(normalizeHomepagePayload(payload));
    next();
  };

  return originalGet.call(this, path, normalizeFooterEmail, ...handlers);
};
