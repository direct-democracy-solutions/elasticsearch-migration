import { MigrationService } from "../services/migration.service.js";
import type { IMigrationConfig } from "../types/migration.interface.js";

async function showStatus() {
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
}

showStatus();
