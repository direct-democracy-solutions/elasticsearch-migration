import fs from "fs";
import path from "path";
import type { IMigrationConfig } from "../types/migration.interface.js";

export async function createMigration(
  migrationName: string,
  config: IMigrationConfig
) {
  try {
    if (!migrationName) {
      throw new Error("Migration name is required");
    }

    // Create migrations directory if it doesn't exist
    const migrationsDir = path.resolve(config.migrationsPath!);
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
      console.log(`Created migrations directory: ${migrationsDir}`);
    }

    // Generate timestamp
    const timestamp = Date.now();
    const fileName = `${timestamp}_${migrationName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}.mts`;
    const filePath = path.join(migrationsDir, fileName);

    // Migration template
    const migrationTemplate = `import { Client } from "@opensearch-project/opensearch";
import type { IMigration } from "elastic-migrate";

const migration: IMigration = {
	name: "${migrationName}",
	timestamp: ${timestamp},
	
	async up(client: Client): Promise<void> {
		// TODO: Implement your migration logic here
		
		// Example 1: Create a new index
		// await client.indices.create({
		//   index: "your_index_name",
		//   body: {
		//     mappings: {
		//       properties: {
		//         title: { type: "text" },
		//         content: { type: "text" },
		//         tags: { type: "keyword" },
		//         created_at: { type: "date" },
		//         status: { type: "keyword" }
		//       }
		//     },
		//     settings: {
		//       number_of_shards: 1,
		//       number_of_replicas: 1
		//     }
		//   }
		// });
		
		// Example 2: Update existing index mapping
		// await client.indices.putMapping({
		//   index: "your_index_name",
		//   body: {
		//     properties: {
		//       new_field: { type: "keyword" }
		//     }
		//   }
		// });
		
		// Example 3: Create an alias
		// await client.indices.putAlias({
		//   index: "your_index_name",
		//   name: "your_alias_name"
		// });
		
		console.log("Migration ${migrationName} executed successfully");
	},
	
	async down(client: Client): Promise<void> {
		// TODO: Implement rollback logic here
		// This method should undo what the 'up' method did
		
		// Example 1: Delete the index
		// await client.indices.delete({
		//   index: "your_index_name"
		// });
		
		// Example 2: Remove the alias
		// await client.indices.deleteAlias({
		//   index: "your_index_name",
		//   name: "your_alias_name"
		// });
		
		console.log("Migration ${migrationName} rolled back successfully");
	}
};

export default migration;
`;

    // Write migration file
    fs.writeFileSync(filePath, migrationTemplate);

    console.log(`Migration file created: ${filePath}`);
    console.log(`Migration name: ${migrationName}`);
    console.log(`Timestamp: ${timestamp}`);
    console.log(`Date: ${new Date(timestamp).toISOString()}`);
  } catch (error) {
    console.error("Error creating migration:", error);
    throw error;
  }
}
