import { MigrationService } from "../services/migration.service.js";
import { fileURLToPath } from "url";
import { config } from "./config.js";

export async function forgetMigration(name?: string | number) {
  try {
    const migrationService = new MigrationService(config);
    await migrationService.forgetMigration(name);
  } catch (error) {
    console.error("Error forgetting migration:", error);
    process.exit(1);
  }
}

// Standalone execution
function main() {
  const nameOrTimestamp = process.argv[2];
  const timestamp = Number.parseInt(nameOrTimestamp ?? NaN, 10);
  return forgetMigration(Number.isNaN(timestamp) ? nameOrTimestamp : timestamp);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
