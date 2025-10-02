import { Client } from "@opensearch-project/opensearch";
import type {
  IMigration,
  IMigrationConfig,
} from "../types/migration.interface.js";
import fs from "fs";
import path from "path";
import { DeleteByQuery } from "@opensearch-project/opensearch/api/requestParams";

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

    const files = fs.readdirSync(migrationsDir).filter((file) => {
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
   *
   * @param name filter to migrations with a particular name (or timestamp)
   */
  async getAppliedMigrations(name?: string | number): Promise<IMigration[]> {
    await this.init();
    const searchTerm = name;
    const searchKey = typeof name === "string" ? "name" : "timestamp";

    // Get all applied migrations from .migrations index
    const response = await this.client.search({
      index: this.migrationIndex,
      body: {
        size: 1000,
        sort: [{ timestamp: { order: "asc" } }],
      },
    });

    const migrations: IMigration[] = response.body["hits"]["hits"].map(
      (hit: any) => hit._source,
    );
    return searchTerm === undefined
      ? migrations
      : migrations.filter((m) => m[searchKey] === searchTerm);
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<IMigration[]> {
    const available = await this.getAvailableMigrations();
    const applied = await this.getAppliedMigrations();

    return available.filter((m) => !applied.some((n) => matches(m, n)));
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
      `Found ${allMigrations.length} migrations ordered by creation date`,
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
            migration.timestamp,
          ).toISOString()}) already applied, skipping`,
        );
        continue;
      }

      console.log(
        `Applying migration "${migration.name}" (${new Date(
          migration.timestamp,
        ).toISOString()})`,
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
    const lastMigration = await this.getLastMigration();

    if (lastMigration === null) {
      console.log("No migrations to revert");
      return;
    }

    // Find the migration file
    const available = await this.getAvailableMigrations();
    const migration = available.find((m) => m.name === lastMigration.name);

    if (!migration || !migration.down) {
      console.log(
        `Migration ${lastMigration.name} cannot be reverted (no down method)`,
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

      console.log(
        `Migration ${lastMigration.name} (${lastMigration.timestamp}) reverted successfully`,
      );
    } catch (error) {
      console.error(
        `Error reverting migration ${lastMigration.name} (${lastMigration.timestamp}):`,
        error,
      );
      throw error;
    }
  }

  /**
   * Remove a migration from the index without rolling it back
   */
  async forgetMigration(name?: string | number) {
    const migration = await (name === undefined
      ? this.getLastMigration()
      : this.findOneBy(name));

    if (migration === null) {
      console.log(
        name === undefined
          ? "No migrations to forget"
          : `${name}: No matching applied migrations`,
      );
      return;
    } else if (migration instanceof NotUniqueError) {
      console.log(migration.message);
      return;
    }

    try {
      await this.deleteOne(migration);
      console.log(`Migration ${migration.name} removed from migrations index`);
    } catch (error) {
      console.error(`Error forgetting migration ${migration.name}:`, error);
      throw error;
    }
  }

  private async getLastMigration(): Promise<IMigration | null> {
    const applied = await this.getAppliedMigrations();
    if (applied.length === 0) {
      return null;
    }
    return applied[applied.length - 1];
  }

  private async findOneBy(
    name: string | number,
  ): Promise<IMigration | NotUniqueError | null> {
    const migrations = await this.getAppliedMigrations(name);
    switch (migrations.length) {
      case 0:
        return null;
      case 1:
        return migrations[0];
      default:
        return new NotUniqueError(name, migrations);
    }
  }

  /** Remove the specified query from applied migrations.
   *
   * Throws an error if multiple migrations are deleted.
   *
   * @param migration
   * @private
   */
  private async deleteOne(migration: IMigration): Promise<void> {
    const result = await this.client.deleteByQuery(
      this.deleteExactBody(migration),
    );

    if (result.body.deleted > 1) {
      throw new Error(
        `We seem to have forgotten ${result.body.deleted} migrations instead of one. ` +
          "This is a bug. Please report.",
      );
    }
  }

  private deleteExactBody(migration: IMigration): DeleteByQuery {
    return {
      index: this.migrationIndex,
      body: {
        query: {
          bool: {
            filter: [
              { term: { name: migration.name } },
              { term: { timestamp: migration.timestamp } },
            ],
          },
        },
      },
      refresh: true,
    };
  }
}

class NotUniqueError extends Error {
  private readonly idThatCollided: string | number;
  private readonly migrations: IMigration[];

  constructor(idThatCollided: string | number, migrations: IMigration[]) {
    if (migrations.length < 2) {
      super(`Actually ${migrations.length} migration${migrations.length === 1 ? "" : "s"};
      probably this shouldn't be an error.`);
    } else {
      const typeOfIdThatCollided =
        typeof idThatCollided === "string" ? "name" : "timestamp";
      const typeOfIdToAdd =
        typeOfIdThatCollided === "name" ? "timestamp" : "name";
      super(
        `${typeOfIdThatCollided} '${idThatCollided}' refers to ${migrations.length} migrations. Specify a ${typeOfIdToAdd}: ${migrations.map((m) => m[typeOfIdToAdd])}.`,
      );
    }
    this.idThatCollided = idThatCollided;
    this.migrations = migrations;
  }
}

export function matches(m1: IMigration, m2: IMigration) {
  return m1.name === m2.name && m1.timestamp === m2.timestamp;
}
