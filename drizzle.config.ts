
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  driver: 'better-sqlite',
  dbCredentials: {
    url: 'sqlite.db'
  },
});
