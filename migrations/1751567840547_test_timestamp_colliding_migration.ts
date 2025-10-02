import type { IMigration } from "..";

const migration: IMigration = {
  name: "test_timestamp_colliding_migration",
  timestamp: 1751567840547,

  async up(): Promise<void> {
    console.log(
      "Migration test_timestamp_colliding_migration executed successfully",
    );
  },

  async down(): Promise<void> {
    console.log(
      "Migration test_timestamp_colliding_migration rolled back successfully",
    );
  },
};

export default migration;
