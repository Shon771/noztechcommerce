import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL belum dikonfigurasi.",
  );
}

const shadowDatabaseUrl =
  process.env["SHADOW_DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: databaseUrl,
    ...(shadowDatabaseUrl
      ? { shadowDatabaseUrl }
      : {}),
  },
});