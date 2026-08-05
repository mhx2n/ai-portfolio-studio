import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";

const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || Boolean(process.env["DEV_SERVER__PROJECT_PATH"]);

const requiredPaths = isLovableSandbox
  ? ["dist/server/index.mjs", "dist/server/wrangler.json", "dist/client"]
  : ["dist/_worker.js/index.js", "dist/_routes.json"];

for (const path of requiredPaths) {
  try {
    await access(path, constants.R_OK);
  } catch {
    console.error(`Cloudflare Pages output is incomplete: missing ${path}`);
    process.exit(1);
  }
}

const output = await readdir("dist");
console.log(
  `${isLovableSandbox ? "Lovable preview" : "Cloudflare Pages"} output verified: dist/${output.join(", dist/")}`,
);