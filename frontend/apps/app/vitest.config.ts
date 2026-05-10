import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "react-native": fileURLToPath(
        new URL("./test/mocks/react-native.ts", import.meta.url)
      ),
    },
  },
  test: {
    server: {
      deps: {
        inline: true,
      },
    },
    globals: true,
    include: ["**/*.test.{ts,tsx}"],
  },
})
