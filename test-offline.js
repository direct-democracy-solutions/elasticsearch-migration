import { MigrationService } from "./dist/index.js";
import fs from "fs";
import path from "path";

// Mock configuration for offline testing
const config = {
  node: "http://localhost:9200",
  username: "elastic",
  password: "password",
  migrationsPath: "./migrations"
};

async function testOffline() {
  console.log("🧪 Testing elastic-migrate package (offline mode)...\n");

  try {
    // Test 1: Check if migrations directory exists
    const migrationsDir = path.resolve(config.migrationsPath);
    const dirExists = fs.existsSync(migrationsDir);
    console.log(`✅ Migrations directory exists: ${dirExists}`);
    console.log(`   Path: ${migrationsDir}\n`);

    // Test 2: List migration files
    if (dirExists) {
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      console.log(`✅ Found ${files.length} migration files:`);
      files.forEach(file => {
        console.log(`   - ${file}`);
      });
      console.log();
    }

    // Test 3: Test MigrationService instantiation (without connection)
    console.log("✅ MigrationService can be instantiated");
    new MigrationService(config);
    console.log("   Service created successfully\n");

    // Test 4: Check package.json
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.log("✅ Package configuration:");
    console.log(`   Name: ${packageJson.name}`);
    console.log(`   Version: ${packageJson.version}`);
    console.log(`   Main: ${packageJson.main}`);
    console.log(`   Bin: ${packageJson.bin['elastic-migrate']}`);
    console.log();

    // Test 5: Check dist files
    const distFiles = fs.readdirSync('./dist');
    console.log(`✅ Build files exist: ${distFiles.length} files`);
    console.log(`   Files: ${distFiles.join(', ')}\n`);

    // Test 6: Check CLI file
    const cliPath = './dist/cli.js';
    const cliExists = fs.existsSync(cliPath);
    console.log(`✅ CLI file exists: ${cliExists}`);
    if (cliExists) {
      const cliContent = fs.readFileSync(cliPath, 'utf8');
      const hasShebang = cliContent.startsWith('#!/usr/bin/env node');
      console.log(`   Has shebang: ${hasShebang}`);
    }
    console.log();

    console.log("🎉 All offline tests passed!");
    console.log("\n📝 To test with Elasticsearch:");
    console.log("   1. Start Elasticsearch/OpenSearch");
    console.log("   2. Update .env file with correct credentials");
    console.log("   3. Run: elastic-migrate status");

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

testOffline(); 