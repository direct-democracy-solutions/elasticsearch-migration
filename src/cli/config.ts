// Load environment variables
import { IMigrationConfig } from "../types/migration.interface";
import "dotenv/config";

// Configuration from environment variables
export const config: IMigrationConfig = {
  node: process.env.ELASTIC_SEARCH_NODE ?? "http://localhost:9200",
  username: process.env.ELASTIC_SEARCH_USERNAME,
  password: process.env.ELASTIC_SEARCH_PASSWORD,
  migrationsPath: process.env.MIGRATIONS_PATH ?? "./migrations",
};
