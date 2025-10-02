import { jest } from "@jest/globals";
import { Client } from "@opensearch-project/opensearch";
import { MigrationService } from "../src";
import type { IMigrationConfig } from "../src";
import * as path from "path";
import { matches } from "../src/services/migration.service";

describe("E2E Tests", () => {
  let client: Client;
  let migrationService: MigrationService;
  let oldLog: typeof console.log;

  const migrationIndex = ".test-migrations";

  const testConfig: IMigrationConfig = {
    node: process.env.ELASTIC_SEARCH_NODE || "http://127.0.0.1:9200",
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

    oldLog = console.log;
    console.log = jest.fn();
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

    console.log = oldLog;
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

    describe("forget", () => {
      it("should remove the most recent migration without calling the down function if no argument", async () => {
        const migrations = await migrationService.getPendingMigrations();
        expect(migrations.length).toBeGreaterThanOrEqual(1);
        const migrationToForget = migrations[0];
        const rollback = migrationToForget.down;
        migrationToForget.down = jest
          .fn()
          .mockReturnValue(Promise.resolve()) as () => Promise<void>;
        try {
          await migrationService.applyMigration(migrationToForget);
          try {
            await migrationService.forgetMigration();
            expect(await migrationService.getAppliedMigrations()).not.toContain(
              migrationToForget,
            );
            expect(await migrationService.getPendingMigrations()).toContain(
              migrationToForget,
            );
            expect(migrationToForget.down).not.toHaveBeenCalled();
          } finally {
            const pending = await migrationService.getPendingMigrations();
            if (pending.some((m) => matches(migrationToForget, m))) {
              await migrationService.downMigration();
            } else if (typeof rollback === "function") {
              await rollback(client);
            }
          }
        } finally {
          migrationToForget.down = rollback;
        }
      });

      it(
        "should forget a single migration by unique name",
        testForgetBy("name"),
      );

      it(
        "should refuse to forget a migration by non-unique name",
        testDontForgetAmbiguous("name", "test_migration"),
      );

      it(
        "should forget a single migration by unique timestamp",
        testForgetBy("timestamp"),
      );

      it(
        "should refuse to forget a migration by non-unique timestamp",
        testDontForgetAmbiguous("timestamp", 1751567840547),
      );

      function testForgetBy(k: "name" | "timestamp") {
        return async () => {
          const migrations = await migrationService.getPendingMigrations();
          expect(migrations.length).toBeGreaterThanOrEqual(2);
          const migrationToForget = migrations[0];
          const migrationNotToForget = migrations.find(
            (m) => m[k] !== migrationToForget[k],
          )!;
          expect(migrationNotToForget).toBeDefined();
          const rollback = migrationToForget.down;
          migrationToForget.down = jest
            .fn()
            .mockReturnValue(Promise.resolve()) as () => Promise<void>;
          try {
            await migrationService.applyMigration(migrationToForget);
            await migrationService.applyMigration(migrationNotToForget);
            try {
              // Verify unique search term
              expect(
                (await migrationService.getAppliedMigrations()).filter(
                  (m) => m[k] === migrationToForget[k],
                ).length,
              ).toBe(1);
              // Forget the migration
              await migrationService.forgetMigration(migrationToForget[k]);
              expect(
                await migrationService.getAppliedMigrations(),
              ).not.toContain(migrationToForget);
              expect(await migrationService.getPendingMigrations()).toContain(
                migrationToForget,
              );
              expect(migrationToForget.down).not.toHaveBeenCalled();
            } finally {
              const pending = await migrationService.getPendingMigrations();
              if (pending.some((p) => matches(p, migrationNotToForget))) {
                await migrationService.downMigration();
              }
              if (pending.some((p) => matches(p, migrationToForget))) {
                await migrationService.downMigration();
              } else if (typeof rollback === "function") {
                await rollback(client);
              }
            }
          } finally {
            migrationToForget.down = rollback;
          }
        };
      }

      function testDontForgetAmbiguous(
        k: "name" | "timestamp",
        v: string | number,
      ) {
        return async () => {
          const migrations = (
            await migrationService.getPendingMigrations()
          ).filter((m) => m[k] === v);
          expect(migrations.length).toBeGreaterThanOrEqual(2);
          const rollback = migrations.map((m) => {
            const r = m.down;
            m.down = jest
              .fn()
              .mockReturnValue(Promise.resolve()) as () => Promise<void>;
            return r;
          });
          try {
            await Promise.all(
              migrations.map((m) => migrationService.applyMigration(m)),
            );
            // Verify non-unique name
            expect(
              (await migrationService.getAppliedMigrations()).filter(
                (m) => m[k],
              ).length,
            ).toBeGreaterThanOrEqual(2);

            // Try to forget the migration
            await migrationService.forgetMigration(v);

            // Make sure it was refused
            const [applied, pending] = await Promise.all([
              migrationService.getAppliedMigrations(),
              migrationService.getPendingMigrations(),
            ]);
            await Promise.all(
              migrations.map((m) => {
                expect(applied.some((a) => matches(a, m))).toBe(true);
                expect(pending.every((p) => !matches(m, p))).toBe(true);
                expect(m.down).not.toHaveBeenCalled();
              }),
            );
          } finally {
            const pending = await migrationService.getAppliedMigrations();
            while (migrations.length > 0) {
              const m = migrations.pop()!;
              const rb = rollback[migrations.length]!;
              try {
                if (pending.some((p) => matches(p, m))) {
                  await migrationService.downMigration();
                } else if (rb !== undefined) {
                  await rb(client);
                }
              } finally {
                m.down = rb;
              }
            }
          }
        };
      }
    });
  });
});
