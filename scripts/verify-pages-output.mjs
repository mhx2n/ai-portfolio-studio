import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";

const requiredPaths = ["dist/_worker.js/index.js", "dist/_routes.json"];

for (const path of requiredPaths) {
  try {
    await access(path, constants.R_OK);
  } catch {
    console.error(`Cloudflare Pages output is incomplete: missing ${path}`);
    process.exit(1);
  }
}

const output = await readdir("dist");
console.log(`Cloudflare Pages output verified: dist/${output.join(", dist/")}`);