import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    include: /.*\.[jt]sx?$/,
    exclude: [],
    lang: "jsx",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    passWithNoTests: false,
  },
});
