
import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Option 1: Passing a connection URI
const sequelize = new Sequelize(`${process.env.DATABASE_URL}`, (process.env.NODE_ENV === 'production') ? {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Needed for Neon
    }
  },
  logging: false // Optional: disable SQL logs in production
} : {dialect: 'postgres'});

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
