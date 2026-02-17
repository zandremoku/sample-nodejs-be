#!/usr/bin/env node
/**
 * Database Migration Script
 * Run this locally before deploying to Vercel to safely apply schema changes
 * Usage: npm run migrate:prod
 */

import sequelize from './api/helpers/dbConnection.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
	console.log('🔄 Starting database migration...');
	console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
	console.log(`🗄️  Database: ${process.env.DATABASE_URL?.split('/').pop()?.split('?')[0] || 'unknown'}\n`);

	try {
		// Authenticate connection
		console.log('🔐 Authenticating database connection...');
		await sequelize.authenticate();
		console.log('✅ Connection established successfully.\n');

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
