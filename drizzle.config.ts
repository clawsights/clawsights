import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL!;
const isLocal = url.startsWith("file:");

export default defineConfig({
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: isLocal ? "sqlite" : "turso",
  dbCredentials: isLocal
    ? { url }
    : { url, authToken: process.env.TURSO_AUTH_TOKEN },
});
