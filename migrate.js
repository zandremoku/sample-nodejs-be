#!/usr/bin/env node
/**
 * Database Migration Script
 * Run this locally before deploying to Vercel to safely apply schema changes
 * Usage: npm run migrate:prod
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine which env file to load
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.argv.includes('--production');

let envFile;
if (isProduction) {
	envFile = path.join(__dirname, '.env.production');
	console.log(`📂 Loading production environment from: ${envFile}\n`);
	// Load production env only
	dotenv.config({ path: envFile, override: true });
	// Explicitly set NODE_ENV for this process
	process.env.NODE_ENV = 'production';
} else {
	envFile = path.join(__dirname, '.env');
	console.log(`📂 Loading development environment from: ${envFile}\n`);
	dotenv.config({ path: envFile, override: true });
}

// NOW import sequelize after env is loaded
const { default: sequelize } = await import('./api/helpers/dbConnection.js');

async function migrate() {
	console.log('🔄 Starting database migration...');
	console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🗄️  Database: ${process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown'}\n`);

	try {
		// Authenticate connection
		console.log('🔐 Authenticating database connection...');
		await sequelize.authenticate();
		console.log('✅ Connection established successfully.\n');

		// Handle enum to integer conversion for income column
		console.log('🔧 Checking for schema fixes needed...');
		try {
			// Step 1: Drop default constraint
			await sequelize.query(`ALTER TABLE "travel_experience" ALTER COLUMN "income" DROP DEFAULT;`);
			
			// Step 2: Convert enum column to integer using CAST, defaulting invalid values to 20000
			await sequelize.query(`
				ALTER TABLE "travel_experience" 
				ALTER COLUMN "income" TYPE INTEGER USING COALESCE(
					(CASE 
						WHEN "income"::text ~ '^[0-9]+$' THEN "income"::text::integer
						ELSE 20000
					END),
					20000
				);
			`);
			
			// Step 3: Set constraints
			await sequelize.query(`
				ALTER TABLE "travel_experience" 
				ALTER COLUMN "income" SET NOT NULL,
				ALTER COLUMN "income" SET DEFAULT 20000;
			`);
			
			// Step 4: Drop the enum type if it exists
			try {
				await sequelize.query(`DROP TYPE IF EXISTS enum_travel_experience_income;`);
				console.log('✅ Fixed income column (enum → integer) and dropped enum type\n');
			} catch (dropError) {
				console.log('✅ Fixed income column (enum → integer)\n');
			}
		} catch (enumError) {
			// Column might already be integer or doesn't exist, continue
			console.log('ℹ️  Income column conversion not needed or already done\n');
			console.log('Details:', enumError.message);
		}

		// Run sync with alter
		console.log('🔨 Syncing models and applying schema changes...');
		await sequelize.sync({ alter: true });
		console.log('✅ All models synchronized successfully!\n');

		// List models
		const models = Object.keys(sequelize.models);
		console.log(`📊 Models synced (${models.length}):`);
		models.forEach((model) => {
			console.log(`   ✓ ${model}`);
		});

		console.log('\n✨ Migration completed successfully!');
		console.log("You can now safely deploy to Vercel.\n");

		process.exit(0);
	} catch (error) {
		console.error('\n❌ Migration failed:');
		console.error(error.message);
		console.error('\n⚠️  Please fix the error above and try again.');
		process.exit(1);
	} finally {
		// Close the connection
		try {
			await sequelize.close();
			console.log('🔌 Database connection closed.');
		} catch (closeError) {
			console.error('Error closing connection:', closeError);
		}
	}
}

migrate();
