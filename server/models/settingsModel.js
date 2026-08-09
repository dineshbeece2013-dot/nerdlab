const db = require('../config/db');

/**
 * Key/value store for runtime configuration an admin can change without a deploy.
 * Values are stored as text; callers are responsible for their own coercion.
 */
class SettingsModel {
  static async getByPrefix(prefix) {
    const { rows } = await db.query('SELECT key, value FROM app_settings WHERE key LIKE $1', [`${prefix}%`]);
    return rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  }

  static async get(key) {
    const { rows } = await db.query('SELECT value FROM app_settings WHERE key = $1', [key]);
    return rows[0] ? rows[0].value : null;
  }

  static async setMany(entries, updatedBy = null) {
    const keys = Object.keys(entries);
    if (keys.length === 0) return;

    for (const key of keys) {
      await db.query(
        `INSERT INTO app_settings (key, value, updated_by, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP`,
        [key, entries[key] === null || entries[key] === undefined ? null : String(entries[key]), updatedBy]
      );
    }
  }
}

module.exports = SettingsModel;
