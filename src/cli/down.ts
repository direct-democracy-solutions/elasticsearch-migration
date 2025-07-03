import { MigrationService } from "../services/migration.service.js";
import type { IMigrationConfig } from "../types/migration.interface.js";

export async function downMigration() {
  try {
    // Load environment variables
    await import("dotenv/config");

    // Configuration from environment variables
    const config: IMigrationConfig = {
      node: process.env.ELASTIC_SEARCH_NODE || "http://localhost:9200",
      username: process.env.ELASTIC_SEARCH_USERNAME,
      password: process.env.ELASTIC_SEARCH_PASSWORD,
      migrationsPath: process.env.MIGRATIONS_PATH || "./migrations",
    };

    const migrationService = new MigrationService(config);
    await migrationService.downMigration();
  } catch (error) {
    console.error("Error running down migration:", error);
    process.exit(1);
  }
}

// Standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  downMigration();
}
