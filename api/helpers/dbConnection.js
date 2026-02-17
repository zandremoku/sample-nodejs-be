
import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Optimized for Vercel serverless environment
const sequelize = new Sequelize(`${process.env.DATABASE_URL}`, {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false // Needed for Neon
    } : false,
    // Serverless-friendly connection settings
    keepalives: 1,
    keepalives_idle: 30,
    statement_timeout: 30000, // 30 seconds
    query_timeout: 30000, // 30 seconds
  },
  // Connection pool configuration for serverless
  pool: {
    max: 2, // Reduced for serverless (vercel functions run single-threaded)
    min: 0, // Start with zero connections
    acquire: 30000, // 30 seconds to acquire a connection
    idle: 10000, // Close connections after 10 seconds idle
    evict: 15000, // Evict connections every 15 seconds
  },
  logging: false, // Disable SQL logs in production
  define: {
    timestamps: true,
    underscored: false,
  },
});

// Ensure we close connections gracefully
const closeConnection = async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
