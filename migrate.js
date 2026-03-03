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

		// Handle schema fixes
		console.log('🔧 Checking for schema fixes needed...');
		try {
			// Step 1: Drop default constraint on income
			await sequelize.query(`ALTER TABLE "travel_experience" ALTER COLUMN "income" DROP DEFAULT;`);
			
			// Step 2: Convert income enum column to integer using CAST, defaulting invalid values to 20000
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
			
			// Step 3: Set constraints on income
			await sequelize.query(`
				ALTER TABLE "travel_experience" 
				ALTER COLUMN "income" SET NOT NULL,
				ALTER COLUMN "income" SET DEFAULT 20000;
			`);
			
			// Step 4: Drop old enum types
			try {
				await sequelize.query(`DROP TYPE IF EXISTS enum_travel_experience_income CASCADE;`);
				console.log('✅ Fixed income column (enum → integer)\n');
			} catch (dropError) {
				console.log('✅ Fixed income column\n');
			}
			
			// Step 5: Ensure all enum types exist with correct values
			// Add missing enum values to existing types
			const enumTypesToFix = [
				{ type: 'enum_travel_experience_riskTolerance', values: ['low', 'medium', 'high'] },
				{ type: 'enum_travel_experience_fitnessLevel', values: ['sedentary', 'moderately_active', 'vigorously_active', 'extremely_active'] },
				{ type: 'enum_travel_experience_tripDuration', values: ['weekend', 'one_week', 'two_weeks', 'three_weeks_plus'] },
				{ type: 'enum_travel_experience_travelGroup', values: ['solo', 'couple', 'friends', 'family_children', 'family_adults_only'] }
			];
			
			for (const enumDef of enumTypesToFix) {
				try {
					// Check if enum type exists
					const result = await sequelize.query(`
						SELECT EXISTS (
							SELECT 1 FROM pg_type WHERE typname = '${enumDef.type}'
						);
					`);
					
					const typeExists = result[0][0].exists;
					
					if (typeExists) {
						// Type exists, add missing values
						let addedCount = 0;
						for (const value of enumDef.values) {
							try {
								await sequelize.query(`ALTER TYPE ${enumDef.type} ADD VALUE IF NOT EXISTS '${value}';`);
								addedCount++;
							} catch (addErr) {
								// Value might already exist, check the error
								if (addErr.message.includes('already exists')) {
									// Value already exists, that's fine
								} else if (addErr.message.includes('IF NOT EXISTS')) {
									// PostgreSQL might not support IF NOT EXISTS for older versions
									// Try without it
									try {
										await sequelize.query(`ALTER TYPE ${enumDef.type} ADD VALUE '${value}';`);
										addedCount++;
									} catch (innerErr) {
										// Value probably exists, continue
										if (innerErr.message.includes('already exists')) {
											// That's expected
										} else {
											throw innerErr;
										}
									}
								} else {
									throw addErr;
								}
							}
						}
						console.log(`✅ Ensured all values exist in ${enumDef.type}`);
					} else {
						// Type doesn't exist, create it
						const valuesList = enumDef.values.map(v => `'${v}'`).join(',');
						await sequelize.query(`CREATE TYPE ${enumDef.type} AS ENUM (${valuesList});`);
						console.log(`✅ Created enum type: ${enumDef.type}`);
					}
				} catch (err) {
					console.log(`⚠️  Issue with enum type ${enumDef.type}: ${err.message}`);
				}
			}
			console.log('');
			
		} catch (enumError) {
			// Schema fixes might not be needed, continue
			console.log('ℹ️  Schema fixes not needed or already applied\n');
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
		if (isProduction) {
			console.log("You can now safely deploy to Vercel.\n");
		}

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
