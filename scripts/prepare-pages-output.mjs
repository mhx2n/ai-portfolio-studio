import { cp, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || Boolean(process.env["DEV_SERVER__PROJECT_PATH"]);

if (!isLovableSandbox) {
  const outputRoot = "dist";
  const compatibilityRoot = join(outputRoot, "client");

  await mkdir(compatibilityRoot, { recursive: true });

  for (const entry of await readdir(outputRoot, { withFileTypes: true })) {
    if (entry.name === "client") continue;

    await cp(join(outputRoot, entry.name), join(compatibilityRoot, entry.name), {
      recursive: entry.isDirectory(),
      force: true,
    });
  }

  console.log(
    "Cloudflare Pages compatibility output prepared for both dist and dist/client.",
  );
}