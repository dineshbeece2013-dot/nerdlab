const db = require('../config/db');

class LeaderboardModel {
  static async getLeaderboard({ limit = 50, offset = 0 } = {}) {
    const query = `
      SELECT l.rank, l.total_points, l.tasks_completed, l.updated_at,
             u.id as user_id, u.name, u.email, u.avatar_url, u.bio
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE u.role = 'student' AND u.is_active = TRUE
      ORDER BY l.rank ASC, l.total_points DESC
      LIMIT $1 OFFSET $2
    `;
    const { rows } = await db.query(query, [limit, offset]);
    
    const countRes = await db.query(`
      SELECT COUNT(*) FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE u.role = 'student' AND u.is_active = TRUE
    `);

    return {
      leaderboard: rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  }

  static async getUserRank(userId) {
    const query = `
      SELECT l.rank, l.total_points, l.tasks_completed,
             u.name, u.avatar_url
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id = $1
    `;
    const { rows } = await db.query(query, [userId]);
    return rows[0] || { rank: 0, total_points: 0, tasks_completed: 0 };
  }
}

module.exports = LeaderboardModel;
