// Builds the store-ready extension into ./dist (or the folder you pass as the first argument):
//   - points API_BASE at production
//   - removes the localhost permission
// Run:  node build.mjs
// Then zip the output (PowerShell: Compress-Archive -Path dist\* -DestinationPath ecareer-apply-assistant.zip)
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PROD = "https://www.ecareerdesign.net";
const OUT = process.argv[2] || "dist";
const KEEP = ["manifest.json", "background.js", "icons", "lib", "sidepanel", "content"];

try { rmSync(OUT, { recursive: true, force: true }); } catch {}
mkdirSync(OUT, { recursive: true });
for (const p of KEEP) cpSync(p, join(OUT, p), { recursive: true, filter: (src) => !src.endsWith("make-icons.mjs") });

const cfgPath = join(OUT, "lib/config.js");
const cfg = readFileSync(cfgPath, "utf8");
if (!/export const API_BASE = ".*?";/.test(cfg)) throw new Error("Couldn't find API_BASE in lib/config.js");
writeFileSync(cfgPath, cfg.replace(/export const API_BASE = ".*?";/, `export const API_BASE = "${PROD}";`));

const mPath = join(OUT, "manifest.json");
const m = JSON.parse(readFileSync(mPath, "utf8"));
m.host_permissions = m.host_permissions.filter((h) => !/localhost|127\.0\.0\.1/.test(h));
writeFileSync(mPath, JSON.stringify(m, null, 2) + "\n");

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(OUT);
const code = (f) => readFileSync(f, "utf8").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
const leftovers = files.filter((f) => !f.endsWith(".png") && /https?:\/\/(localhost|127\.0\.0\.1)/.test(code(f)));
if (leftovers.length) throw new Error("localhost still referenced in: " + leftovers.join(", "));
console.log(`Built ${OUT}/ for ${PROD}: ${files.length} files, version ${m.version}`);
