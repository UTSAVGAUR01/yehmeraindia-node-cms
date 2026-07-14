import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const htmlPath = path.join(dist, "index.html");
const jsPath = path.join(dist, "assets", "app.js");
const cssPath = path.join(dist, "assets", "app.css");

function requireFile(file, label) {
  if (!fs.existsSync(file)) throw new Error(`${label} is missing: ${file}`);
  const size = fs.statSync(file).size;
  if (size < 1) throw new Error(`${label} is empty: ${file}`);
  return size;
}

const htmlSize = requireFile(htmlPath, "Production HTML");
const jsSize = requireFile(jsPath, "Production JavaScript entry");
const cssSize = requireFile(cssPath, "Production stylesheet entry");
const html = fs.readFileSync(htmlPath, "utf8");

if (!html.includes('/assets/app.js')) {
  throw new Error("dist/index.html does not reference /assets/app.js");
}
if (!html.includes('/assets/app.css')) {
  throw new Error("dist/index.html does not reference /assets/app.css");
}
if (html.includes("frontend-recovery.js")) {
  throw new Error("The obsolete frontend recovery script is still included in dist/index.html");
}

console.log(JSON.stringify({
  verified: true,
  htmlBytes: htmlSize,
  javascriptBytes: jsSize,
  stylesheetBytes: cssSize,
}, null, 2));
