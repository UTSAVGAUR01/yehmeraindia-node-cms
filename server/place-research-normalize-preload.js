import express from "express";

let installed = false;
let installing = false;

function install(app) {
  if (installed || installing) return;
  installing = true;
  app.use((req, _res, next) => {
    if (req.method === "POST" && String(req.path || "").toLowerCase() === "/api/places/research") {
      const hierarchy = req.body?.place?.hierarchy;
      if (hierarchy && typeof hierarchy === "object") {
        const country = String(hierarchy.country || "").trim().toLowerCase();
        if (country === "india / भारत" || country === "भारत / india" || country === "भारत") {
          hierarchy.countryBilingual = "India / भारत";
          hierarchy.country = "India";
        }
      }
    }
    next();
  });
  installed = true;
  installing = false;
}

const previousUse = express.application.use;
express.application.use = function placeResearchNormalizeAwareUse(...args) {
  const result = previousUse.apply(this, args);
  const middleware = args.length === 1 && typeof args[0] === "function" ? args[0] : null;
  if (!installed && !installing && middleware?.name === "jsonParser") install(this);
  return result;
};
