import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'shashankalladi',
  host: 'localhost',
  database: 'activitymanagement',
  password: 'postgres',
  port: 5432,
});
 
export const query = (text, params) => pool.query(text, params);