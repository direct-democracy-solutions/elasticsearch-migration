import { MigrationService } from "../services/migration.service.js";
import type { IMigrationConfig } from "../types/migration.interface.js";

async function showAliasInfo() {
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
}

showAliasInfo();
