import { randomUUID } from "node:crypto";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["integration/**/*.test.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    env: {
      CLUBSPOT_SERVER_URL: process.env["CLUBSPOT_SERVER_URL"] || "http://localhost:1337/parse",
      // One ID for the whole run, shared by every test file's workers.
      RUN_ID: process.env["RUN_ID"] || randomUUID().slice(0, 8),
    },
  },
});
