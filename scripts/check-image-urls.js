const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "一坨" || e.name === ".git") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(html|css|js|tsx?|jsx|vue|svg)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(root);
const tempHits = [];
const imgRefs = new Set();

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, "/");
  const t = fs.readFileSync(f, "utf8");

  const urlRe = /https?:\/\/[^\s"'`)>]+/g;
  let m;
  while ((m = urlRe.exec(t))) {
    const url = m[0];
    if (url.includes("www.w3.org/2000/svg")) continue;
    if (url.includes("vaccine.app/invite")) continue;
    if (rel.startsWith("scripts/patch-figma-images.js")) continue;
    const line = t.slice(0, m.index).split("\n").length;
    tempHits.push({ file: rel, line, url });
  }

  const imgRe = /images\/[A-Za-z0-9._\-]+\.(?:png|svg|jpg|jpeg|webp|gif)/g;
  while ((m = imgRe.exec(t))) imgRefs.add(m[0]);
}

const imgDir = path.join(root, "images");
const existing = new Set(fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : []);
const missing = [...imgRefs]
  .map((r) => r.replace("images/", ""))
  .filter((name, i, arr) => arr.indexOf(name) === i)
  .filter((name) => !existing.has(name))
  .sort();

console.log("TEMP_REMOTE_URLS");
console.log(JSON.stringify(tempHits, null, 2));
console.log("MISSING_LOCAL_IMAGES");
console.log(missing.join("\n") || "(none)");
