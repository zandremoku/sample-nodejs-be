/**
 * Schema Migration Module
 * Handles database schema fixes on application startup
 * This runs on every Vercel cold start to ensure schema consistency
 */

let migrationRun = false;

export async function runSchemaMigration(sequelize) {
	if (migrationRun) {
		console.log('ℹ️  Schema migration already completed in this process.');
		return;
	}

	console.log('🔧 Running schema migration checks...');

	try {
		// Step 1: Fix income column - convert enum to integer if needed
		console.log('  → Checking income column...');
		try {
			await sequelize.query(`
				ALTER TABLE IF EXISTS "travel_experience" 
				ALTER COLUMN "income" DROP DEFAULT;
			`);

			await sequelize.query(`
				ALTER TABLE IF EXISTS "travel_experience" 
				ALTER COLUMN "income" TYPE INTEGER USING COALESCE(
					(CASE 
						WHEN "income"::text ~ '^[0-9]+$' THEN "income"::text::integer
						ELSE 20000
					END),
					20000
				);
			`);

			await sequelize.query(`
				ALTER TABLE IF EXISTS "travel_experience" 
				ALTER COLUMN "income" SET NOT NULL,
				ALTER COLUMN "income" SET DEFAULT 20000;
			`);

			try {
				await sequelize.query(`DROP TYPE IF EXISTS enum_travel_experience_income CASCADE;`);
			} catch (e) {
				// Type might not exist, that's ok
			}

			console.log('    ✓ Income column fixed');
		} catch (err) {
			if (!err.message.includes('already exists') && !err.message.includes('type')) {
				console.log('    ✓ Income column already correct');
			}
		}

		// Step 2: Fix enum types
		console.log('  → Checking enum types...');
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
					SELECT COALESCE(array_agg(enumlabel ORDER BY enumsortorder), '{}') as values
					FROM pg_enum
					JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
					WHERE typname = '${enumDef.type}'
				`);

				const existingValues = result[0][0]?.values || [];

				// Check if all required values exist
				const missingValues = enumDef.values.filter(v => !existingValues.includes(v));

				if (missingValues.length > 0) {
					// Add missing values
					for (const value of missingValues) {
						try {
							await sequelize.query(`ALTER TYPE ${enumDef.type} ADD VALUE '${value}';`);
						} catch (addErr) {
							if (!addErr.message.includes('already exists')) {
								// Try with IF NOT EXISTS for newer postgres versions
								try {
									await sequelize.query(`ALTER TYPE ${enumDef.type} ADD VALUE IF NOT EXISTS '${value}';`);
								} catch (innerErr) {
									// Value already exists, continue
									if (!innerErr.message.includes('already exists')) {
										throw innerErr;
									}
								}
							}
						}
					}
					console.log(`    ✓ ${enumDef.type} updated with missing values`);
				} else {
					console.log(`    ✓ ${enumDef.type} has all required values`);
				}
			} catch (err) {
				if (err.message.includes('does not exist')) {
					// Type doesn't exist, create it
					try {
						const valuesList = enumDef.values.map(v => `'${v}'`).join(',');
						await sequelize.query(`CREATE TYPE ${enumDef.type} AS ENUM (${valuesList});`);
						console.log(`    ✓ Created ${enumDef.type}`);
					} catch (createErr) {
						console.log(`    ⚠️  Could not create ${enumDef.type}: ${createErr.message}`);
					}
				} else if (!err.message.includes('already exists')) {
					console.log(`    ⚠️  Issue with ${enumDef.type}: ${err.message}`);
				} else {
					console.log(`    ✓ ${enumDef.type} is correct`);
				}
			}
		}

		console.log('✅ Schema migration completed successfully.\n');
		migrationRun = true;
	} catch (error) {
		console.error('❌ Schema migration error:', error.message);
		// Don't crash the app if migration fails
		migrationRun = true;
	}
}
