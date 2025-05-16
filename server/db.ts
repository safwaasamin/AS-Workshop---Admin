import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = mysql.createPool(process.env.DATABASE_URL);
