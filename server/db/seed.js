const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'devops_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runSeed() {
  try {
    console.log('Running database seed script...');
    const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seedSql);

    // Hash passwords dynamically
    const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
    const studentPasswordHash = await bcrypt.hash('StudentPass123!', 10);

    // Insert Default Admin User
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, bio)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
      ['Platform Admin', 'admin@devops.platform', adminPasswordHash, 'admin', 'DevOps Platform Lead Administrator']
    );

    // Insert Default Student User
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, bio)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      ['Alex Student', 'student@devops.platform', studentPasswordHash, 'student', 'Aspiring Cloud & DevOps Engineer']
    );

    // Initialize leaderboard entry for demo student
    const studentRes = await pool.query(`SELECT id FROM users WHERE email = $1`, ['student@devops.platform']);
    if (studentRes.rows.length > 0) {
      const studentId = studentRes.rows[0].id;
      await pool.query(
        `INSERT INTO leaderboard (user_id, total_points, tasks_completed, rank)
         VALUES ($1, 0, 0, 1)
         ON CONFLICT (user_id) DO NOTHING`,
        [studentId]
      );
    }

    console.log('Database seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('Demo Admin Credentials: admin@devops.platform / AdminPass123!');
    console.log('Demo Student Credentials: student@devops.platform / StudentPass123!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
