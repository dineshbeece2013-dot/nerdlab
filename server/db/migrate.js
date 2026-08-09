const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'devops_platform';
const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'postgres';

async function runMigration() {
  // First connection to default postgres database to ensure target DB exists
  const rootPool = new Pool({ host, port, user, password, database: 'postgres' });

  try {
    const res = await rootPool.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating database...`);
      await rootPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    }
  } catch (err) {
    console.error('Error verifying database existence:', err.message);
  } finally {
    await rootPool.end();
  }

  // Connect to target database and execute DDL schema script
  const appPool = new Pool({ host, port, user, password, database: dbName });

  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Running DDL Schema migration script...');
    await appPool.query(schemaSql);
    console.log('Database migration completed successfully! All tables, indexes, and triggers initialized.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await appPool.end();
  }
}

runMigration();
