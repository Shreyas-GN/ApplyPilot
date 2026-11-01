import * as esbuild from "esbuild";
import { cpSync, mkdirSync } from "fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });

const buildOptions = {
  entryPoints: [
    "src/background/background.ts",
    "src/content/content.ts",
    "src/popup/popup.ts",
  ],
  outdir: "dist",
  outbase: "src",
  bundle: true,
  format: "esm",
  target: "chrome120",
  sourcemap: true,
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log("[extension] watching for changes...");
} else {
  await esbuild.build(buildOptions);
}

cpSync("manifest.json", "dist/manifest.json");
cpSync("src/popup/popup.html", "dist/popup/popup.html");
console.log("[extension] build complete -> dist/");
