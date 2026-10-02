import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["**/*.int.test.ts", "node_modules/**", ".next/**"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["**/*.int.test.ts"],
          exclude: ["node_modules/**", ".next/**"],
          globalSetup: ["test/global-setup.ts"],
          setupFiles: ["test/setup-integration.ts"],
          fileParallelism: false,
          env: {
            BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret",
            BETTER_AUTH_URL: "http://localhost:3000",
          },
        },
      },
    ],
  },
});
