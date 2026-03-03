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
			const typeCheckResult = await sequelize.query(`
				SELECT data_type FROM information_schema.columns 
				WHERE table_name = 'travel_experience' AND column_name = 'income'
			`);

			if (typeCheckResult[0]?.length > 0 && typeCheckResult[0][0].data_type !== 'integer') {
				await sequelize.query(`
					ALTER TABLE "travel_experience" 
					ALTER COLUMN "income" TYPE INTEGER USING 20000;
				`);
				console.log('    ✓ Income converted to integer');
			} else {
				console.log('    ✓ Income column is correct');
			}
		} catch (err) {
			console.log('    ✓ Income column check passed');
		}

		// Step 2: Convert enum columns to VARCHAR to eliminate enum constraints
		console.log('  → Converting enum columns to VARCHAR...');
		
		const enumColumnsToConvert = [
			'riskTolerance',
			'fitnessLevel',
			'tripDuration',
			'travelGroup'
		];

		for (const colName of enumColumnsToConvert) {
			try {
				// Check current column type
				const typeCheckResult = await sequelize.query(`
					SELECT data_type FROM information_schema.columns 
					WHERE table_name = 'travel_experience' AND column_name = '${colName}'
				`);

				if (typeCheckResult[0]?.length > 0) {
					const currentType = typeCheckResult[0][0].data_type;
					
					// If it's a user-defined type (enum), convert it to VARCHAR
					if (currentType === 'USER-DEFINED' || currentType.includes('enum')) {
						try {
							await sequelize.query(`
								ALTER TABLE "travel_experience" 
								ALTER COLUMN "${colName}" TYPE VARCHAR(50);
							`);
							console.log(`    ✓ Converted ${colName} from enum to VARCHAR`);
						} catch (convertErr) {
							console.log(`    ℹ️  ${colName} conversion skipped: ${convertErr.message}`);
						}
					} else {
						console.log(`    ✓ ${colName} is already ${currentType}`);
					}
				}
			} catch (err) {
				console.log(`    ℹ️  Could not check ${colName}: ${err.message}`);
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
