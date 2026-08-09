const db = require('../config/db');

class LogModel {
  static async createActivityLog({ userId, sessionId = null, action, details = {}, ipAddress, browser, operatingSystem, userAgent, durationSeconds = 0 }) {
    const query = `
      INSERT INTO activity_logs (user_id, session_id, action, details, ip_address, browser, operating_system, user_agent, duration_seconds)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      userId || null,
      sessionId || null,
      action,
      JSON.stringify(details),
      ipAddress || '127.0.0.1',
      browser || 'Unknown',
      operatingSystem || 'Unknown',
      userAgent || '',
      durationSeconds,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async recordLoginHistory({ userId, ipAddress, userAgent, browser, operatingSystem, status = 'success' }) {
    const query = `
      INSERT INTO login_history (user_id, ip_address, user_agent, browser, operating_system, login_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [userId, ipAddress, userAgent, browser, operatingSystem, status];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async getActivityLogs({ limit = 100, offset = 0, userId = null, action = '' } = {}) {
    let query = `
      SELECT al.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      query += ` AND al.user_id = $${params.length}`;
    }

    if (action) {
      params.push(`%${action.toLowerCase()}%`);
      query += ` AND LOWER(al.action) LIKE $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);
    
    // Count total logs
    let countQuery = `SELECT COUNT(*) FROM activity_logs WHERE 1=1`;
    const countParams = [];
    if (userId) {
      countParams.push(userId);
      countQuery += ` AND user_id = $1`;
    }
    if (action) {
      countParams.push(`%${action.toLowerCase()}%`);
      countQuery += ` AND LOWER(action) LIKE $${countParams.length}`;
    }
    const countRes = await db.query(countQuery, countParams);

    return {
      logs: rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }

  static async getLoginHistory(userId, limit = 20) {
    const query = `
      SELECT * FROM login_history
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const { rows } = await db.query(query, [userId, limit]);
    return rows;
  }
}

module.exports = LogModel;
