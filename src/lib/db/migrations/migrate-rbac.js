#!/usr/bin/env node

/**
 * RBAC Migration Runner
 * Executes RBAC database migrations in the correct order
 */

const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gpp-next';
const MIGRATIONS_DIR = __dirname;
const MIGRATION_COLLECTION = 'rbac_migrations';

class RBACMigrationRunner {
  constructor(mongoUri) {
    this.mongoUri = mongoUri;
    this.client = null;
    this.db = null;
  }

  async connect() {
    console.log('Connecting to MongoDB...');
    this.client = new MongoClient(this.mongoUri, {
      useUnifiedTopology: true,
    });
    
    await this.client.connect();
    this.db = this.client.db();
    
    // Ensure migrations collection exists
    await this.db.createCollection(MIGRATION_COLLECTION, {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          required: ['version', 'name', 'status', 'executedAt'],
          properties: {
            version: { bsonType: 'string' },
            name: { bsonType: 'string' },
            status: { 
              bsonType: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'reverted']
            },
            executedAt: { bsonType: 'date' },
            completedAt: { bsonType: 'date' },
            error: { bsonType: 'string' }
          }
        }
      }
    });
    
    console.log('✓ Connected to MongoDB');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('✓ Disconnected from MongoDB');
    }
  }

  async loadMigrations() {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.startsWith('rbac-migration-') && file.endsWith('.js'))
      .sort();

    const migrations = [];
    for (const file of files) {
      const migration = require(path.join(MIGRATIONS_DIR, file));
      migrations.push(migration);
    }

    return migrations;
  }

  async getExecutedMigrations() {
    const executed = await this.db.collection(MIGRATION_COLLECTION)
      .find({ status: 'completed' })
      .sort({ version: 1 })
      .toArray();
    
    return executed.map(m => m.version);
  }

  async markMigrationStarted(migration) {
    await this.db.collection(MIGRATION_COLLECTION).updateOne(
      { version: migration.version },
      {
        $set: {
          version: migration.version,
          name: migration.name,
          status: 'running',
          executedAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  async markMigrationCompleted(migration) {
    await this.db.collection(MIGRATION_COLLECTION).updateOne(
      { version: migration.version },
      {
        $set: {
          status: 'completed',
          completedAt: new Date()
        }
      }
    );
  }

  async markMigrationFailed(migration, error) {
    await this.db.collection(MIGRATION_COLLECTION).updateOne(
      { version: migration.version },
      {
        $set: {
          status: 'failed',
          error: error.message,
          completedAt: new Date()
        }
      }
    );
  }

  async runMigrations(direction = 'up') {
    console.log(`\n🚀 Running RBAC migrations (direction: ${direction})`);
    console.log('='.repeat(50));

    const migrations = await this.loadMigrations();
    const executedVersions = await this.getExecutedMigrations();

    if (direction === 'up') {
      // Run pending migrations
      const pendingMigrations = migrations.filter(m => !executedVersions.includes(m.version));
      
      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations to run');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(m => {
        console.log(`   - ${m.version}: ${m.name}`);
      });

      for (const migration of pendingMigrations) {
        await this.runSingleMigration(migration, 'up');
      }
    } else if (direction === 'down') {
      // Revert the last executed migration
      const lastExecuted = migrations
        .filter(m => executedVersions.includes(m.version))
        .pop();

      if (!lastExecuted) {
        console.log('✅ No migrations to revert');
        return;
      }

      await this.runSingleMigration(lastExecuted, 'down');
    }

    console.log('\n✅ All migrations completed successfully!');
  }

  async runSingleMigration(migration, direction) {
    console.log(`\n🔧 ${direction === 'up' ? 'Applying' : 'Reverting'} migration: ${migration.version} - ${migration.name}`);
    
    try {
      if (direction === 'up') {
        await this.markMigrationStarted(migration);
      }

      const startTime = Date.now();
      
      if (direction === 'up' && migration.up) {
        await migration.up(this.db);
        await this.markMigrationCompleted(migration);
      } else if (direction === 'down' && migration.down) {
        await migration.down(this.db);
        // Remove from migrations collection
        await this.db.collection(MIGRATION_COLLECTION).deleteOne({ version: migration.version });
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Migration ${migration.version} ${direction === 'up' ? 'applied' : 'reverted'} successfully (${duration}ms)`);

    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error.message);
      
      if (direction === 'up') {
        await this.markMigrationFailed(migration, error);
      }
      
      throw error;
    }
  }

  async status() {
    console.log('\n📊 RBAC Migration Status');
    console.log('='.repeat(50));

    const migrations = await this.loadMigrations();
    const migrationRecords = await this.db.collection(MIGRATION_COLLECTION)
      .find({})
      .sort({ version: 1 })
      .toArray();

    const recordsMap = migrationRecords.reduce((acc, record) => {
      acc[record.version] = record;
      return acc;
    }, {});

    if (migrations.length === 0) {
      console.log('📋 No migrations found');
      return;
    }

    console.log('📋 Migration Status:');
    console.log('');

    migrations.forEach(migration => {
      const record = recordsMap[migration.version];
      let status = '⏳ Pending';
      let details = '';

      if (record) {
        switch (record.status) {
          case 'completed':
            status = '✅ Completed';
            details = `(${record.completedAt.toISOString()})`;
            break;
          case 'running':
            status = '🔄 Running';
            details = `(started: ${record.executedAt.toISOString()})`;
            break;
          case 'failed':
            status = '❌ Failed';
            details = `(${record.error})`;
            break;
          case 'reverted':
            status = '↩️  Reverted';
            details = `(${record.completedAt.toISOString()})`;
            break;
        }
      }

      console.log(`   ${migration.version}: ${migration.name}`);
      console.log(`   ${status} ${details}`);
      console.log('');
    });

    const completedCount = migrations.filter(m => recordsMap[m.version]?.status === 'completed').length;
    const failedCount = migrations.filter(m => recordsMap[m.version]?.status === 'failed').length;
    const pendingCount = migrations.length - completedCount - failedCount;

    console.log(`📈 Summary: ${completedCount} completed, ${pendingCount} pending, ${failedCount} failed`);
  }

  async reset() {
    console.log('\n⚠️  Resetting all RBAC migrations...');
    console.log('='.repeat(50));

    const migrations = await this.loadMigrations();
    
    // Revert all migrations in reverse order
    const executedVersions = await this.getExecutedMigrations();
    const executedMigrations = migrations
      .filter(m => executedVersions.includes(m.version))
      .reverse();

    for (const migration of executedMigrations) {
      await this.runSingleMigration(migration, 'down');
    }

    // Clear the migrations collection
    await this.db.collection(MIGRATION_COLLECTION).deleteMany({});

    console.log('\n✅ All RBAC migrations have been reset!');
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || 'up';
  const runner = new RBACMigrationRunner(MONGODB_URI);

  try {
    await runner.connect();

    switch (command) {
      case 'up':
        await runner.runMigrations('up');
        break;
      case 'down':
        await runner.runMigrations('down');
        break;
      case 'status':
        await runner.status();
        break;
      case 'reset':
        const confirm = process.argv[3];
        if (confirm !== '--confirm') {
          console.log('⚠️  This will revert ALL RBAC migrations. Use --confirm to proceed.');
          console.log('Usage: node migrate-rbac.js reset --confirm');
          process.exit(1);
        }
        await runner.reset();
        break;
      default:
        console.log('Usage: node migrate-rbac.js [up|down|status|reset]');
        console.log('');
        console.log('Commands:');
        console.log('  up      - Run pending migrations (default)');
        console.log('  down    - Revert the last migration');
        console.log('  status  - Show migration status');
        console.log('  reset   - Revert all migrations (requires --confirm)');
        process.exit(1);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await runner.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RBACMigrationRunner };