import { Client } from "@opensearch-project/opensearch";
import type { IMigration } from "./src/types/migration.interface.js";

const migration: IMigration = {
	name: "example_migration",
	timestamp: Date.now(),

	async up(client: Client): Promise<void> {
		// Örnek: Yeni bir indeks oluştur
		await client.indices.create({
			index: "example_index",
			body: {
				mappings: {
					properties: {
						title: { type: "text" },
						content: { type: "text" },
						tags: { type: "keyword" },
						created_at: { type: "date" },
					},
				},
			},
		});

		console.log("Example index created successfully");
	},

	async down(client: Client): Promise<void> {
		// Örnek: İndeksi sil
		await client.indices.delete({
			index: "example_index",
		});

		console.log("Example index deleted successfully");
	},
};

export default migration;
