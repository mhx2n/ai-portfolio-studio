import { access, readdir } from "node:fs/promises";
import { constants } from "node:fs";

const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || Boolean(process.env["DEV_SERVER__PROJECT_PATH"]);

if (isLovableSandbox) {
  // In Lovable sandbox the preview build still uses the cloudflare-module preset.
  const requiredPaths = [
    "dist/server/index.mjs",
    "dist/client",
  ];
  for (const path of requiredPaths) {
    try {
      await access(path, constants.R_OK);
    } catch {
      console.error(`Lovable preview output is incomplete: missing ${path}`);
      process.exit(1);
    }
  }
  const output = await readdir("dist");
  console.log(`Lovable preview output verified: dist/${output.join(", dist/")}`);
  process.exit(0);
}

// Vercel Nitro preset output layout.
const requiredPaths = [
  ".vercel/output/config.json",
  ".vercel/output/static",
  ".vercel/output/functions/__nitro.func",
];

for (const path of requiredPaths) {
  try {
    await access(path, constants.R_OK);
  } catch {
    console.error(`Vercel output is incomplete: missing ${path}`);
    process.exit(1);
  }
}

const output = await readdir(".vercel/output");
console.log(`Vercel output verified: .vercel/output/${output.join(", .vercel/output/")}`);
