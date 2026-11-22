// Bundles the compiled CLI and its dependencies into dist-bundle/memoneo.cjs
// for pkg. pkg cannot resolve ESM package imports from its snapshot, so the
// binary gets one CommonJS file with nothing left to resolve at runtime.
import { build } from "esbuild"
import * as fs from "fs/promises"

const OUT_DIR = "dist-bundle"
const ENTRY_FILE = "memoneo.cjs"

const pkg = JSON.parse(await fs.readFile("package.json", "utf-8"))

await fs.rm(OUT_DIR, { recursive: true, force: true })

await build({
  entryPoints: ["dist/binary.js"],
  outfile: `${OUT_DIR}/${ENTRY_FILE}`,
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node24",
  // createRequire(import.meta.url) in constants/env.ts needs a real URL.
  define: { "import.meta.url": "importMetaUrl" },
  banner: {
    js: 'const importMetaUrl = require("url").pathToFileURL(__filename).href;',
  },
  logLevel: "warning",
})

const bundlePkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  // pkg only skips bytecode (--no-bytecode) for packages with a license.
  license: pkg.license,
  bin: { memoneo: ENTRY_FILE },
  oclif: {
    ...pkg.oclif,
    commands: {
      strategy: "explicit",
      target: `./${ENTRY_FILE}`,
      identifier: "COMMANDS",
    },
  },
}

await fs.writeFile(
  `${OUT_DIR}/package.json`,
  JSON.stringify(bundlePkg, null, 2) + "\n"
)
