import mysql from 'mysql2/promise';
import dotenv from '../.env';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set in .env');
}

// Create the connection pool
const pool = mysql.createPool(process.env.DATABASE_URL);

export default pool;
