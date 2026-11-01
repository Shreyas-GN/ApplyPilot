import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    // Integration tests hit a real Postgres + Redis over the network, and
    // run sequentially against the same test database — the default 5s
    // unit-test timeout is too tight for that, and concurrency would let
    // tests race each other's rows.
    testTimeout: 20_000,
    fileParallelism: false,
  },
});
