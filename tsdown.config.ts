import { defineConfig } from "tsdown";

export default defineConfig([
  {
    entry: ["src/cli.ts"],
    format: "esm",
    platform: "node",
    target: "node20",
    banner: "#!/usr/bin/env node",
    clean: true,
    outDir: "dist",
    dts: false,
  },
  {
    entry: ["src/index.ts"],
    format: "esm",
    platform: "node",
    target: "node20",
    clean: false,
    outDir: "dist",
    dts: true,
  },
]);
