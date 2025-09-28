import { Client } from "@opensearch-project/opensearch";
import { MigrationService } from "../src";
import type { IMigrationConfig } from "../src";
import path from "path";

describe("E2E Tests", () => {
  let client: Client;
  let migrationService: MigrationService;

  const migrationIndex = ".test-migrations";

  const testConfig: IMigrationConfig = {
    node: process.env.ELASTIC_SEARCH_NODE || "http://localhost:9200",
    username: process.env.ELASTIC_SEARCH_USERNAME,
    password: process.env.ELASTIC_SEARCH_PASSWORD,
    migrationsPath: path.resolve(import.meta.dirname, "..", "migrations"),
    migrationIndex,
  };

  beforeAll(async () => {
    client = new Client({
      node: testConfig.node,
      auth:
        testConfig.username && testConfig.password
          ? {
              username: testConfig.username,
              password: testConfig.password,
            }
          : undefined,
    });

    migrationService = new MigrationService(testConfig);
  });

  afterAll(async () => {
    const exists = await client.indices.exists({
      index: migrationIndex,
    });

    if (exists.body) {
      await client.indices.delete({
        index: migrationIndex,
      });
    }
  });

  describe("Elasticsearch Connection", () => {
    test("should connect to Elasticsearch and get cluster info", async () => {
      const info = await client.info();
      expect(info).toBeDefined();
      expect(info.body).toBeDefined();
      expect(info.body.cluster_name).toBeDefined();
    });

    test("should get cluster health status", async () => {
      const health = await client.cluster.health();
      expect(health).toBeDefined();
      expect(health.body).toBeDefined();
      expect(health.body.status).toMatch(/^(green|yellow|red)$/);
    });

    test("should list indices", async () => {
      const indices = await migrationService.getIndices();
      expect(Array.isArray(indices)).toBe(true);
    });
  });

  describe("Migration Service", () => {
    test("should initialize migration service", async () => {
      await expect(migrationService.init()).resolves.not.toThrow();
      const exists = await client.indices.exists({
        index: migrationIndex,
      });
      expect(exists.body).toBe(true);
    });

    test("should get available migrations (empty)", async () => {
      const migrations = await migrationService.getAvailableMigrations();
      expect(migrations.length).toBeGreaterThanOrEqual(3);
      expect(migrations[0]).toEqual(
        expect.objectContaining({
          name: "test_migration",
          timestamp: 1751567580331,
        }),
      );
    });

    test("should get applied migrations (empty)", async () => {
      const appliedMigrations = await migrationService.getAppliedMigrations();
      expect(appliedMigrations).toEqual([]);
    });
  });
});
