import { MigrationService } from "../services/migration.service.js";
import type { IMigrationConfig } from "../types/migration.interface.js";

async function listIndices() {
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
}

listIndices();
