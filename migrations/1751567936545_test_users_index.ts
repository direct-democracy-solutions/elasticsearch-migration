import { Client } from "@opensearch-project/opensearch";
import type { IMigration } from "..";

const migration: IMigration = {
  name: "test_users_index",
  timestamp: 1751567936545,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    console.log("Migration test_users_index executed successfully");
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    console.log("Migration test_users_index rolled back successfully");
  },
};

export default migration;
