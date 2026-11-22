import { execute } from "@oclif/core"

// Entry point of the single-file CommonJS bundle (scripts/bundle.mjs). The
// bundle is also oclif's explicit command target, so it exports COMMANDS.
export { COMMANDS } from "./commands.js"

void execute({ dir: __filename })
