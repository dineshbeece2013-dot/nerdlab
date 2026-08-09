const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'devops_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('PostgreSQL Database connected successfully.');
  }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
