import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

export const client = postgres({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.SSL === undefined ? 'require' : !!process.env.SSL,
});
