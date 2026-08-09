const db = require('../config/db');

class UserModel {
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email.toLowerCase().trim()]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, name, email, role, avatar_url, bio, is_active, created_at, updated_at FROM users WHERE id = $1';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async create({ name, email, passwordHash, role = 'student', avatarUrl = null, bio = '' }) {
    const query = `
      INSERT INTO users (name, email, password_hash, role, avatar_url, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, avatar_url, bio, created_at
    `;
    const values = [
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      role,
      avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      bio,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async updateProfile(id, { name, bio, avatarUrl }) {
    const query = `
      UPDATE users
      SET name = COALESCE($1, name),
          bio = COALESCE($2, bio),
          avatar_url = COALESCE($3, avatar_url),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, role, avatar_url, bio, updated_at
    `;
    const { rows } = await db.query(query, [name, bio, avatarUrl, id]);
    return rows[0];
  }

  static async updatePassword(id, passwordHash) {
    const query = 'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await db.query(query, [passwordHash, id]);
  }

  static async getAllStudents({ limit = 50, offset = 0, search = '' }) {
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
             COALESCE(l.total_points, 0) as total_points,
             COALESCE(l.tasks_completed, 0) as tasks_completed
      FROM users u
      LEFT JOIN leaderboard l ON u.id = l.user_id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`;
    }

    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    
    // Count total students for pagination
    let countQuery = `SELECT COUNT(*) FROM users WHERE role = 'student'`;
    const countParams = [];
    if (search) {
      countParams.push(`%${search.toLowerCase()}%`);
      countQuery += ` AND (LOWER(name) LIKE $1 OR LOWER(email) LIKE $1)`;
    }
    const countRes = await db.query(countQuery, countParams);

    return {
      students: rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }

  static async createPasswordResetToken(userId, token, expiresAt) {
    const query = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(query, [userId, token, expiresAt]);
    return rows[0];
  }

  static async findValidPasswordResetToken(token) {
    const query = `
      SELECT * FROM password_reset_tokens
      WHERE token = $1 AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP
    `;
    const { rows } = await db.query(query, [token]);
    return rows[0];
  }

  static async markTokenUsed(tokenId) {
    const query = 'UPDATE password_reset_tokens SET is_used = TRUE WHERE id = $1';
    await db.query(query, [tokenId]);
  }
}

module.exports = UserModel;
