#!/usr/bin/env node

import { Command } from "commander";
import { MigrationService } from "./services/migration.service.js";
import type { IMigrationConfig } from "./types/migration.interface.js";

const program = new Command();

program
  .name("es-migrate")
  .description("Elasticsearch/OpenSearch migration tool")
  .version("1.0.0");

// Load environment variables
await import("dotenv/config");

// Default configuration
const defaultConfig: IMigrationConfig = {
  node: process.env.ELASTIC_SEARCH_NODE || "http://localhost:9200",
  username: process.env.ELASTIC_SEARCH_USERNAME,
  password: process.env.ELASTIC_SEARCH_PASSWORD,
  migrationsPath: process.env.MIGRATIONS_PATH || "./migrations",
};

program
  .command("create")
  .description("Create a new migration")
  .argument("<name>", "Migration name")
  .action(async (name) => {
    try {
      const { createMigration } = await import("./cli/create.js");
      await createMigration(name, defaultConfig);
    } catch (error) {
      console.error("Error creating migration:", error);
      process.exit(1);
    }
  });

program
  .command("up")
  .description("Run pending migrations")
  .action(async () => {
    try {
      const migrationService = new MigrationService(defaultConfig);
      await migrationService.runMigrations();
    } catch (error) {
      console.error("Error running migrations:", error);
      process.exit(1);
    }
  });

program
  .command("status")
  .description("Show migration status")
  .action(async () => {
    try {
      const migrationService = new MigrationService(defaultConfig);
      const available = await migrationService.getAvailableMigrations();
      const applied = await migrationService.getAppliedMigrations();
      const pending = await migrationService.getPendingMigrations();

      console.log("=== Migration Status ===");
      console.log(`Total migrations: ${available.length}`);
      console.log(`Applied migrations: ${applied.length}`);
      console.log(`Pending migrations: ${pending.length}`);
      console.log();

      if (applied.length > 0) {
        console.log("Applied migrations:");
        applied.forEach((migration) => {
          console.log(
            `  ✓ ${migration.name} (${new Date(
              migration.timestamp,
            ).toISOString()})`,
          );
        });
        console.log();
      }

      if (pending.length > 0) {
        console.log("Pending migrations:");
        pending.forEach((migration) => {
          console.log(
            `  ✗ ${migration.name} (${new Date(
              migration.timestamp,
            ).toISOString()})`,
          );
        });
      } else {
        console.log("No pending migrations");
      }
    } catch (error) {
      console.error("Error checking migration status:", error);
      process.exit(1);
    }
  });

program
  .command("list-indices")
  .description("List all indices")
  .action(async () => {
    try {
      const migrationService = new MigrationService(defaultConfig);
      const indices = await migrationService.getIndices();

      console.log("=== Available Indices ===");
      if (indices.length > 0) {
        indices.forEach((index) => {
          console.log(`  - ${index}`);
        });
      } else {
        console.log("No indices found");
      }
    } catch (error) {
      console.error("Error listing indices:", error);
      process.exit(1);
    }
  });

program
  .command("alias-info")
  .description("Show alias information")
  .action(async () => {
    try {
      const migrationService = new MigrationService(defaultConfig);
      const aliases = await migrationService.getAliasInfo();

      console.log("=== Alias Information ===");
      if (aliases && aliases.length > 0) {
        aliases.forEach((alias: any) => {
          console.log(`  ${alias.alias} -> ${alias.index}`);
        });
      } else {
        console.log("No aliases found");
      }
    } catch (error) {
      console.error("Error getting alias information:", error);
      process.exit(1);
    }
  });

program
  .command("down")
  .description("Revert the last migration")
  .action(async () => {
    try {
      const { downMigration } = await import("./cli/down.js");
      await downMigration();
    } catch (error) {
      console.error("Error running down migration:", error);
      process.exit(1);
    }
  });

program.parse();
