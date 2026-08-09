/**
 * Applies every .sql file in db/migrations in filename order.
 *
 * Unlike db/migrate.js — which runs schema.sql and DROPs every table — this is
 * additive and safe to run against a database that already holds student data.
 * Each migration must be written so that re-running it is a no-op.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'devops_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function applyMigrations() {
  const dir = path.join(__dirname, 'migrations');
  if (!fs.existsSync(dir)) {
    console.log('No migrations directory — nothing to apply.');
    return;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write(`Applying ${file} ... `);
    await pool.query(sql);
    console.log('ok');
  }
  console.log(`${files.length} migration(s) applied.`);
}

applyMigrations()
  .catch((err) => {
    console.error('\nMigration failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
