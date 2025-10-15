import { MigrationService } from "../services/migration.service.js";
import type { IMigrationConfig } from "../types/migration.interface.js";

async function runMigrations() {
  try {
    // Load environment variables
    await import("dotenv/config");

    // Configuration from environment variables
    const config: IMigrationConfig = {
      node: process.env.ELASTIC_SEARCH_NODE || "http://127.0.0.1:9200",
      username: process.env.ELASTIC_SEARCH_USERNAME,
      password: process.env.ELASTIC_SEARCH_PASSWORD,
      migrationsPath: process.env.MIGRATIONS_PATH || "./migrations",
    };

    const migrationService = new MigrationService(config);
    await migrationService.runMigrations();
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();
