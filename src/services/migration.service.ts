import { Client } from "@opensearch-project/opensearch";
import type {
  IMigration,
  IMigrationConfig,
} from "../types/migration.interface.js";
import fs from "fs";
import path from "path";

const DEFAULT_MIGRATION_INDEX = ".migrations";
const DEFAULT_MIGRATIONS_PATH = "./migrations";

export class MigrationService {
  private client: Client;
  private config: IMigrationConfig;
  private migrationIndex: string;
  private migrationsPath: string;

  constructor(config: IMigrationConfig) {
    this.config = config;
    this.migrationIndex = config.migrationIndex || DEFAULT_MIGRATION_INDEX;
    this.migrationsPath = config.migrationsPath || DEFAULT_MIGRATIONS_PATH;

    this.client = new Client({
      node: this.config.node,
      auth:
        this.config.username && this.config.password
          ? {
              username: this.config.username,
              password: this.config.password,
            }
          : undefined,
      ssl: {
        rejectUnauthorized: false, // For development environments
      },
    });
  }

  /**
   * Initialize migrations
   */
  async init(): Promise<void> {
    // Check if migration index exists
    const exists = await this.client.indices.exists({
      index: this.migrationIndex,
    });

    if (!exists.body) {
      // Create migration index if it doesn't exist
      await this.client.indices.create({
        index: this.migrationIndex,
        body: {
          mappings: {
            properties: {
              name: { type: "keyword" },
              timestamp: { type: "date" },
              applied: { type: "date" },
            },
          },
        },
      });
    }
  }

  /**
   * Get all available migrations
   */
  async getAvailableMigrations(): Promise<IMigration[]> {
    const migrationsDir = path.resolve(this.migrationsPath);

    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`Migrations directory not found: ${migrationsDir}`);
      return [];
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => {
        return /\.m?[tj]s$/.test(file);
      });

    const migrations: IMigration[] = [];

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      try {
        // Dynamic import for ESM
        const migration = await import(filePath);
        if (migration.default) {
          migrations.push(migration.default);
        }
      } catch (error) {
        console.error(`Error loading migration ${file}:`, error);
      }
    }

    return migrations.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<any[]> {
    await this.init();

    // Get all applied migrations from .migrations index
    const response = await this.client.search({
      index: this.migrationIndex,
      body: {
        size: 1000,
        sort: [{ timestamp: { order: "asc" } }],
      },
    });

    return response.body["hits"]["hits"].map((hit: any) => hit._source);
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<IMigration[]> {
    const available = await this.getAvailableMigrations();
    const applied = await this.getAppliedMigrations();

    const appliedNames = applied.map((m) => m.name);
    return available.filter((m) => !appliedNames.includes(m.name));
  }

  /**
   * Apply a migration
   */
  async applyMigration(migration: IMigration): Promise<void> {
    console.log(`Applying migration: ${migration.name}`);

    // Doğrudan migration'ı çalıştır
    await migration.up(this.client);

    // Record migration as applied
    await this.client.index({
      index: this.migrationIndex,
      body: {
        name: migration.name,
        timestamp: migration.timestamp,
        applied: new Date().toISOString(),
      },
      refresh: true,
    });

    console.log(`Migration ${migration.name} applied successfully`);
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      console.log("No pending migrations found");
      return;
    }

    console.log(`Found ${pending.length} pending migrations`);

    for (const migration of pending) {
      await this.applyMigration(migration);
    }

    console.log("All migrations completed successfully");
  }

  /**
   * Run migrations in order of creation date (timestamp)
   * This method gets all migrations ordered by creation timestamp
   * and applies each one individually
   */
  async runMigrationsInOrder(): Promise<void> {
    // Get all migrations sorted by creation date (timestamp)
    const allMigrations = await this.getAvailableMigrations();

    // Get already applied migrations to avoid duplicates
    const applied = await this.getAppliedMigrations();

    // Daha güvenli bir karşılaştırma için hem isim hem de timestamp kullanıyoruz
    const appliedMigrations = new Map();
    applied.forEach((m) => {
      appliedMigrations.set(m.name, m.timestamp);
    });

    console.log(
      `Found ${allMigrations.length} migrations ordered by creation date`
    );

    // Apply each migration one by one if not already applied
    for (const migration of allMigrations) {
      // Eğer aynı isim ve timestamp ile uygulanmışsa geç
      if (
        appliedMigrations.has(migration.name) &&
        appliedMigrations.get(migration.name) === migration.timestamp
      ) {
        console.log(
          `Migration "${migration.name}" (${new Date(
            migration.timestamp
          ).toISOString()}) already applied, skipping`
        );
        continue;
      }

      console.log(
        `Applying migration "${migration.name}" (${new Date(
          migration.timestamp
        ).toISOString()})`
      );
      await this.applyMigration(migration);
    }

    console.log("All migrations have been applied successfully");
  }

  /**
   * Get Elasticsearch indices
   */
  async getIndices(): Promise<string[]> {
    const response = await this.client.cat.indices({
      format: "json",
    });

    return Array.isArray(response.body)
      ? response.body.map((index: any) => index["index"])
      : [];
  }

  /**
   * Get alias information
   */
  async getAliasInfo(): Promise<any> {
    const response = await this.client.cat.aliases({
      format: "json",
    });

    return response.body;
  }

  /**
   * Revert the last applied migration
   */
  async downMigration(): Promise<void> {
    const applied = await this.getAppliedMigrations();

    if (applied.length === 0) {
      console.log("No migrations to revert");
      return;
    }

    const lastMigration = applied[applied.length - 1];
    console.log(`Reverting migration: ${lastMigration.name}`);

    // Find the migration file
    const available = await this.getAvailableMigrations();
    const migration = available.find((m) => m.name === lastMigration.name);

    if (!migration || !migration.down) {
      console.log(
        `Migration ${lastMigration.name} cannot be reverted (no down method)`
      );
      return;
    }

    try {
      // Execute the down migration
      await migration.down(this.client);

      // Remove from applied migrations
      await this.client.deleteByQuery({
        index: this.migrationIndex,
        body: {
          query: {
            match: {
              name: lastMigration.name,
            },
          },
        },
        refresh: true,
      });

      console.log(`Migration ${lastMigration.name} reverted successfully`);
    } catch (error) {
      console.error(`Error reverting migration ${lastMigration.name}:`, error);
      throw error;
    }
  }
}
