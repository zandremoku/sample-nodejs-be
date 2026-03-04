/**
 * Manual Migration Script
 * Run this manually to fix schema issues before deploying
 * 
 * Usage:
 *   npm run migrate          # Fix development database
 *   npm run migrate:prod     # Fix production database
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Sequelize from 'sequelize';
import { runSchemaMigration } from './api/helpers/schemaMigration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Determine environment
const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
const envFile = isProduction ? '.env.production' : '.env';

// Load environment variables
dotenv.config({ path: path.join(__dirname, envFile) });

async function runMigration() {
	try {
		console.log(`\n🔧 Running migration on ${isProduction ? 'PRODUCTION' : 'development'} database...\n`);
        console.log('Database url is:', process.env.DATABASE_URL, '\n');
		// Create Sequelize connection
		const sequelize = new Sequelize(process.env.DATABASE_URL, {
			logging: false,
			dialect: 'postgres',
			ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
		});

		// Test connection
		await sequelize.authenticate();
		console.log('✅ Database connection established\n');

		// Run schema migration
		await runSchemaMigration(sequelize);

		// Sync models
		console.log('🔄 Syncing models...');
		await sequelize.sync({ alter: false });
		console.log('✅ Models synced successfully\n');

		// Close connection
		await sequelize.close();
		console.log('✅ Migration complete!\n');
		process.exit(0);
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message, '\n');
		process.exit(1);
	}
}

runMigration();
