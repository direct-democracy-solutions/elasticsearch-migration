import { Client } from "@opensearch-project/opensearch";

/**
 * Interface for migration operations
 */
export interface IMigration {
	/**
	 * The name of the migration
	 */
	name: string;

	/**
	 * The timestamp when the migration was created
	 */
	timestamp: number;

	/**
	 * Execute the migration
	 * @param client Elasticsearch client
	 * @returns Promise<void>
	 */
	up(client: Client): Promise<void>;

	/**
	 * Revert the migration
	 * @param client Elasticsearch client
	 * @returns Promise<void>
	 */
	down?(client: Client): Promise<void>;
}

/**
 * Configuration interface for the migration service
 */
export interface IMigrationConfig {
	/**
	 * Elasticsearch/OpenSearch node URL
	 */
	node: string;

	/**
	 * Username for authentication
	 */
	username?: string;

	/**
	 * Password for authentication
	 */
	password?: string;

	/**
	 * Path to migrations directory
	 */
	migrationsPath?: string;

	/**
	 * Migration index name (default: .migrations)
	 */
	migrationIndex?: string;
}
