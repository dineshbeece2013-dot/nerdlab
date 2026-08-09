const db = require('../config/db');

class TaskModel {
  static async getAllCategories() {
    const query = `
      SELECT c.id, c.name, c.slug, c.description, c.icon,
             COUNT(t.id)::int as total_tasks
      FROM categories c
      LEFT JOIN tasks t ON c.id = t.category_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `;
    const { rows } = await db.query(query);
    return rows;
  }

  static async createCategory({ name, description = '', icon = null }) {
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const query = `
      INSERT INTO categories (name, slug, description, icon)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await db.query(query, [name.trim(), slug, description, icon]);
    return rows[0];
  }

  static async findCategoryBySlug(slug) {
    const { rows } = await db.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    return rows[0];
  }

  static async countTasksInCategory(categoryId) {
    const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM tasks WHERE category_id = $1', [categoryId]);
    return rows[0].count;
  }

  static async deleteCategory(id) {
    const { rows } = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  static async getAllTasks({ categorySlug = null, difficulty = null, search = '' } = {}) {
    let query = `
      SELECT t.id, t.module_id, t.category_id, t.title, t.slug, t.description,
             t.difficulty, t.points, t.estimated_minutes, t.file_path, t.is_coming_soon, t.created_at,
             c.name as category_name, c.slug as category_slug
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categorySlug) {
      params.push(categorySlug);
      query += ` AND c.slug = $${params.length}`;
    }

    if (difficulty) {
      params.push(difficulty);
      query += ` AND t.difficulty = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(t.title) LIKE $${params.length} OR LOWER(t.description) LIKE $${params.length})`;
    }

    query += ` ORDER BY t.id ASC`;
    const { rows } = await db.query(query, params);
    return rows;
  }

  static async getTaskById(id) {
    const query = `
      SELECT t.*, c.name as category_name, c.slug as category_slug
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = $1
    `;
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }

  static async getTaskBySlug(slug) {
    const query = `
      SELECT t.*, c.name as category_name, c.slug as category_slug
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.slug = $1
    `;
    const { rows } = await db.query(query, [slug]);
    return rows[0];
  }

  static async createTask({ moduleId, categoryId, title, slug, description, difficulty, points, estimatedMinutes, filePath }) {
    const query = `
      INSERT INTO tasks (module_id, category_id, title, slug, description, difficulty, points, estimated_minutes, file_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      moduleId || null,
      categoryId || null,
      title,
      slug,
      description,
      difficulty || 'Easy',
      points || 100,
      estimatedMinutes || 30,
      filePath,
    ];
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  // Updates only the fields present in `fields`. file_path and slug are not
  // editable here — they are tied to the HTML file on disk and to bookmarked URLs.
  static async updateTask(id, fields) {
    const ALLOWED = ['module_id', 'category_id', 'title', 'description', 'difficulty', 'points', 'estimated_minutes', 'is_coming_soon'];
    const sets = [];
    const values = [];

    ALLOWED.forEach((column) => {
      if (Object.prototype.hasOwnProperty.call(fields, column)) {
        values.push(fields[column]);
        sets.push(`${column} = $${values.length}`);
      }
    });

    if (sets.length === 0) return this.getTaskById(id);

    values.push(id);
    const query = `UPDATE tasks SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`;
    const { rows } = await db.query(query, values);
    return rows[0];
  }

  static async deleteTask(id) {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  }
}

module.exports = TaskModel;
