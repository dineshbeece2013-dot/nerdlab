const db = require('../config/db');

class ProgressModel {
  static async recordOpenTask(userId, taskId) {
    const query = `
      INSERT INTO student_progress (user_id, task_id, status, attempts, last_visited_at)
      VALUES ($1, $2, 'opened', 1, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, task_id)
      DO UPDATE SET
        attempts = student_progress.attempts + 1,
        last_visited_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await db.query(query, [userId, taskId]);
    return rows[0];
  }

  static async recordTaskCompletion(userId, taskId, score = 100, timeSpentSeconds = 0) {
    const query = `
      INSERT INTO student_progress (user_id, task_id, status, score, time_spent_seconds, completed_at, last_visited_at)
      VALUES ($1, $2, 'completed', $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, task_id)
      DO UPDATE SET
        status = 'completed',
        score = GREATEST(student_progress.score, EXCLUDED.score),
        time_spent_seconds = student_progress.time_spent_seconds + EXCLUDED.time_spent_seconds,
        completed_at = COALESCE(student_progress.completed_at, CURRENT_TIMESTAMP),
        last_visited_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await db.query(query, [userId, taskId, score, timeSpentSeconds]);

    // Recalculate user leaderboard total points and completion count
    await this.updateLeaderboardForUser(userId);

    return rows[0];
  }

  static async updateTimeSpent(userId, taskId, timeSpentSeconds) {
    const query = `
      UPDATE student_progress
      SET time_spent_seconds = time_spent_seconds + $3,
          last_visited_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND task_id = $2
      RETURNING *
    `;
    const { rows } = await db.query(query, [userId, taskId, timeSpentSeconds]);
    return rows[0];
  }

  static async getUserProgress(userId) {
    const query = `
      SELECT sp.*, t.title as task_title, t.slug as task_slug, t.points, t.difficulty,
             c.name as category_name, c.slug as category_slug
      FROM student_progress sp
      JOIN tasks t ON sp.task_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE sp.user_id = $1
      ORDER BY sp.last_visited_at DESC
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }

  static async getUserTaskProgress(userId, taskId) {
    const query = 'SELECT * FROM student_progress WHERE user_id = $1 AND task_id = $2';
    const { rows } = await db.query(query, [userId, taskId]);
    return rows[0];
  }

  static async updateLeaderboardForUser(userId) {
    const statsQuery = `
      SELECT COALESCE(SUM(t.points), 0)::int as total_points,
             COUNT(sp.id)::int as tasks_completed
      FROM student_progress sp
      JOIN tasks t ON sp.task_id = t.id
      WHERE sp.user_id = $1 AND sp.status = 'completed'
    `;
    const { rows: statsRows } = await db.query(statsQuery, [userId]);
    const { total_points, tasks_completed } = statsRows[0];

    const upsertLeaderboardQuery = `
      INSERT INTO leaderboard (user_id, total_points, tasks_completed)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        total_points = EXCLUDED.total_points,
        tasks_completed = EXCLUDED.tasks_completed,
        updated_at = CURRENT_TIMESTAMP
    `;
    await db.query(upsertLeaderboardQuery, [userId, total_points, tasks_completed]);

    // Recalculate rank for all users in leaderboard
    const recalculateRanksQuery = `
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY total_points DESC, tasks_completed DESC) as new_rank
        FROM leaderboard
      )
      UPDATE leaderboard l
      SET rank = r.new_rank
      FROM ranked r
      WHERE l.id = r.id
    `;
    await db.query(recalculateRanksQuery);
  }
}

module.exports = ProgressModel;
