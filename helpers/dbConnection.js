
import {Sequelize} from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Option 1: Passing a connection URI
const sequelize = new Sequelize(`${process.env.PGDATABASE_URL}`);

try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
