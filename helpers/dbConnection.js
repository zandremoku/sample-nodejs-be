
import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Option 1: Passing a connection URI
const sequelize = new Sequelize(`${process.env.DATABASE_URL}`, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Needed for Neon
    }
  },
  logging: false // Optional: disable SQL logs in production
});

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
