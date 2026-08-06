import { writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || Boolean(process.env["DEV_SERVER__PROJECT_PATH"]);

// Cloudflare Pages re-bundles dist/_worker.js with esbuild and honours the
// nearest package.json. The repo root sets "sideEffects": false, which makes
// esbuild drop side-effect-only imports such as `import "../_runtime.mjs"` and
// breaks SSR at runtime. Emitting a local package.json overrides that.
if (!isLovableSandbox) {
  const workerDir = "dist/_worker.js";
  try {
    await access(`${workerDir}/index.js`, constants.R_OK);
  } catch {
    console.error(`Cloudflare Pages output is incomplete: missing ${workerDir}/index.js`);
    process.exit(1);
  }

  await writeFile(
    `${workerDir}/package.json`,
    `${JSON.stringify({ type: "module", sideEffects: true }, null, 2)}\n`,
  );

  console.log("Cloudflare Pages worker prepared: dist/_worker.js/package.json written.");
}
