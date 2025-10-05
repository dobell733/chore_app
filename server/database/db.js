require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,      
  port: process.env.DB_PORT,       
  user: process.env.DB_USER,      
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function queryDB(queryString, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(queryString, params);
    return result.rows;
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = queryDB;
