// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// Make sure DATABASE_URL is set in your environment

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  const sql = neon(process.env.DATABASE_URL);
  const schema = readFileSync(join(__dirname, "../schema.sql"), "utf8");

  console.log("Setting up database...");
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const statement of statements) {
    await sql(statement);
    console.log("✓", statement.slice(0, 60) + "...");
  }

  console.log("\n✅ Database setup complete!");
}

setup().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
