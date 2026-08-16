const crypto = require('crypto');
const db = require('../config/db');

// CERT-GIT-2026-4F91 — category hint, year, and a random tail. The tail is the
// part that makes a code unguessable; the rest is only there to be readable.
function buildCode(categorySlug) {
  const hint = (categorySlug || 'lab').replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase() || 'LAB';
  const year = new Date().getFullYear();
  const tail = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CERT-${hint}-${year}-${tail}`;
}

class CertificateModel {
  /**
   * Issues the certificate for a completed task, once. Re-running after a
   * replayed completion returns the certificate that already exists rather
   * than minting a second code for the same lab.
   *
   * Returns { certificate, isNew }.
   */
  static async issueForTask(userId, task, recipientName) {
    const existing = await db.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND task_id = $2',
      [userId, task.id]
    );
    if (existing.rows[0]) {
      return { certificate: existing.rows[0], isNew: false };
    }

    // The unique index is the real guard: two completions arriving at once both
    // pass the check above, and the loser of that race lands here.
    const query = `
      INSERT INTO certificates (user_id, task_id, title, recipient_name, certificate_code)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, task_id) WHERE task_id IS NOT NULL DO NOTHING
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      userId,
      task.id,
      task.title,
      recipientName || null,
      buildCode(task.category_slug),
    ]);

    if (rows[0]) {
      return { certificate: rows[0], isNew: true };
    }

    const raced = await db.query(
      'SELECT * FROM certificates WHERE user_id = $1 AND task_id = $2',
      [userId, task.id]
    );
    return { certificate: raced.rows[0], isNew: false };
  }

  static async getUserCertificates(userId) {
    const query = `
      SELECT c.id,
             c.certificate_code,
             c.issued_at,
             c.task_id,
             c.course_id,
             -- Fall back to the live titles for the older per-course rows,
             -- which were created before titles were snapshotted.
             COALESCE(c.title, t.title, co.title) AS title,
             c.recipient_name,
             cat.name AS category_name,
             cat.slug AS category_slug,
             t.slug   AS task_slug,
             t.points AS points,
             sp.completed_at
      FROM certificates c
      LEFT JOIN tasks t       ON c.task_id = t.id
      LEFT JOIN courses co    ON c.course_id = co.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      LEFT JOIN student_progress sp ON sp.user_id = c.user_id AND sp.task_id = c.task_id
      WHERE c.user_id = $1
      ORDER BY c.issued_at DESC
    `;
    const { rows } = await db.query(query, [userId]);
    return rows;
  }
}

module.exports = CertificateModel;
