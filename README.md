---
# Elastic Migrate

A migration tool for Elasticsearch/OpenSearch. This package helps you manage your Elasticsearch indices and mappings with ease.
---

## 🚀 Installation

```bash
npm install @ahmetkasap/elasticsearch-migration
```

---

## ⚡️ Usage

### 1. Create a New Migration

```bash
npx es-migrate create <migration-name>
```

This command creates a new migration file. For example:

```bash
npx es-migrate create create_users_index
```

---

### 2. Run Migrations

```bash
npx es-migrate up
```

Applies all pending migrations in order.

---

#### Running from a CommonJS project
`es-migrate` runs and expects ESM. If you have a CommonJS project and
wish to run `es-migrate`, pass an ESM loader to Node explicitly:

```
node --loader ts-node/esm node_modules/@ahmetkasap/elasticsearch-migration/dist/cli.js
```
`tsx` might work but hasn't been tested.

Your migrations should have the `.mts` or `.mjs` file extensions, not `.ts`.

### 3. Check Migration Status

```bash
npx es-migrate status
```

Displays the status of all migrations.

---

### 4. List Indices

```bash
npx es-migrate list-indices
```

Lists all indices in your Elasticsearch cluster.

---

### 5. Show Alias Information

```bash
npx es-migrate alias-info
```

Displays detailed information about index aliases.

---

### 6. Rollback Last Migration

```bash
npx es-migrate down
```

Reverts the last applied migration (rollback).

---

## ⚙️ Configuration

You can configure the tool using environment variables:

```env
# Elasticsearch connection details
ELASTIC_SEARCH_NODE=http://localhost:9200
ELASTIC_SEARCH_USERNAME=elastic
ELASTIC_SEARCH_PASSWORD=password

# Directory for migration files
MIGRATIONS_PATH=./migrations
```

---

## 📝 Example Migration File

```typescript
import { Client } from "@opensearch-project/opensearch";
import type { IMigration } from "@ahmetkasap/elasticsearch-migration";

const migration: IMigration = {
  name: "create_users_index",
  timestamp: 1703123456789,

  async up(client: Client): Promise<void> {
    await client.indices.create({
      index: "users",
      body: {
        mappings: {
          properties: {
            name: { type: "text" },
            email: { type: "keyword" },
            age: { type: "integer" },
          },
        },
      },
    });
    console.log("Users index created successfully");
  },

  async down(client: Client): Promise<void> {
    await client.indices.delete({
      index: "users",
    });
    console.log("Users index deleted successfully");
  },
};

export default migration;
```

---

## 🧑‍💻 Programmatic Usage

```typescript
import { MigrationService } from "@ahmetkasap/elasticsearch-migration";
import type { IMigrationConfig } from "@ahmetkasap/elasticsearch-migration";

const config: IMigrationConfig = {
  node: "http://localhost:9200",
  username: "elastic",
  password: "password",
  migrationsPath: "./migrations",
};

const migrationService = new MigrationService(config);

// Run all migrations
await migrationService.runMigrations();

// Check pending migrations
const pending = await migrationService.getPendingMigrations();
console.log(`Pending migrations: ${pending.length}`);
```

---

## 🧩 Migration Interface

```typescript
interface IMigration {
  name: string;
  timestamp: number;
  up(client: Client): Promise<void>;
  down?(client: Client): Promise<void>;
}
```

---

## ⭐️ Features

- ✅ TypeScript support
- ✅ Elasticsearch/OpenSearch compatibility
- ✅ Migration status tracking
- ✅ Sequential migration execution
- ✅ Rollback support
- ✅ CLI interface
- ✅ Programmatic API

---

## 🛠 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Start (run built version)
npm start

# Migration commands (development)
npm run migrate:create <name>    # Create new migration
npm run migrate:up              # Run pending migrations
npm run migrate:down            # Rollback last migration
npm run migrate:status          # Check migration status
npm run migrate:list-indices    # List all indices
npm run migrate:alias-info      # Show alias information

# Build and prepare for publish
npm run prepublishOnly
```

---

## License

MIT

---

If you want this as a markdown file or need further formatting (badges, npm/yarn install, etc.), just let me know!
