const db = require('../config/db');
const UserModel = require('../models/userModel');
const TaskModel = require('../models/taskModel');
const LogModel = require('../models/logModel');
const TaskService = require('../services/taskService');
const SettingsModel = require('../models/settingsModel');
const EmailService = require('../services/emailService');
const ResponseHandler = require('../utils/responseHandler');

// Normalizes difficulty to the values allowed by the tasks.difficulty CHECK constraint
const DIFFICULTY_MAP = {
  easy: 'Easy', beginner: 'Easy',
  medium: 'Medium', intermediate: 'Medium',
  hard: 'Hard', advanced: 'Hard',
};

class AdminController {
  static async getDashboardAnalytics(req, res, next) {
    try {
      const usersCount = await db.query(`SELECT COUNT(*) FROM users WHERE role = 'student'`);
      const tasksCount = await db.query(`SELECT COUNT(*) FROM tasks`);
      const coursesCount = await db.query(`SELECT COUNT(*) FROM courses`);
      const completionsCount = await db.query(`SELECT COUNT(*) FROM student_progress WHERE status = 'completed'`);

      const recentLogs = await LogModel.getActivityLogs({ limit: 10 });

      return ResponseHandler.success(res, 'Admin analytics summary fetched.', {
        totalStudents: parseInt(usersCount.rows[0].count, 10),
        totalTasks: parseInt(tasksCount.rows[0].count, 10),
        totalCourses: parseInt(coursesCount.rows[0].count, 10),
        totalCompletions: parseInt(completionsCount.rows[0].count, 10),
        recentActivityLogs: recentLogs.logs,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudents(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const search = req.query.search || '';

      const data = await UserModel.getAllStudents({ limit, offset, search });
      return ResponseHandler.success(res, 'Students list fetched.', data);
    } catch (err) {
      next(err);
    }
  }

  static async toggleStudentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      await db.query(`UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role = 'student'`, [
        is_active,
        id,
      ]);

      if (req.logActivity) {
        await req.logActivity('Toggle Student Status', { studentId: id, is_active });
      }

      return ResponseHandler.success(res, `Student account status updated to ${is_active ? 'Active' : 'Inactive'}.`);
    } catch (err) {
      next(err);
    }
  }

  static async uploadTask(req, res, next) {
    try {
      const { categorySlug, title, description, difficulty, points, estimatedMinutes, htmlContent, fileName } = req.body;

      if (!title || !categorySlug || !htmlContent) {
        return ResponseHandler.error(res, 'Title, Category, and HTML content are required.', 400);
      }

      const normalizedDifficulty = DIFFICULTY_MAP[String(difficulty || 'easy').toLowerCase()];
      if (!normalizedDifficulty) {
        return ResponseHandler.error(res, `Invalid difficulty "${difficulty}". Allowed: Easy, Medium, Hard.`, 400);
      }

      // Generate slug and file name
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let taskFileName = (fileName || '').trim() || `${slug}.html`;
      taskFileName = taskFileName.replace(/[\\/]/g, ''); // block path traversal
      if (!taskFileName.toLowerCase().endsWith('.html')) taskFileName += '.html';

      // Find Category ID
      const catRes = await db.query(`SELECT id FROM categories WHERE slug = $1`, [categorySlug]);
      if (!catRes.rows[0]) {
        return ResponseHandler.error(res, `Unknown category "${categorySlug}".`, 400);
      }
      const categoryId = catRes.rows[0].id;

      // Create Task Record in Database first, then persist the file
      const newTask = await TaskModel.createTask({
        categoryId,
        title,
        slug,
        description,
        difficulty: normalizedDifficulty,
        points: parseInt(points || '100', 10),
        estimatedMinutes: parseInt(estimatedMinutes || '30', 10),
        filePath: `tasks/${categorySlug}/${taskFileName}`,
      });

      // Save static HTML file; roll back the DB row if the write fails
      let relativeFilePath;
      try {
        relativeFilePath = TaskService.saveTaskHtmlFile(categorySlug, taskFileName, htmlContent);
      } catch (fileErr) {
        await TaskModel.deleteTask(newTask.id);
        throw fileErr;
      }

      if (req.logActivity) {
        await req.logActivity('Upload Task HTML', { taskId: newTask.id, title: newTask.title, filePath: relativeFilePath });
      }

      return ResponseHandler.success(res, 'Task HTML uploaded and registered successfully.', newTask, 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, difficulty, points, estimatedMinutes, categorySlug } = req.body;

      const existing = await TaskModel.getTaskById(id);
      if (!existing) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      const fields = {};

      if (title !== undefined) {
        if (!String(title).trim()) {
          return ResponseHandler.error(res, 'Title cannot be empty.', 400);
        }
        if (String(title).length > 150) {
          return ResponseHandler.error(res, 'Title must be 150 characters or fewer.', 400);
        }
        fields.title = String(title).trim();
      }

      if (description !== undefined) {
        fields.description = description === null ? null : String(description).trim();
      }

      if (difficulty !== undefined) {
        const normalized = DIFFICULTY_MAP[String(difficulty).toLowerCase()];
        if (!normalized) {
          return ResponseHandler.error(res, `Invalid difficulty "${difficulty}". Allowed: Easy, Medium, Hard.`, 400);
        }
        fields.difficulty = normalized;
      }

      if (points !== undefined) {
        const parsed = parseInt(points, 10);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) {
          return ResponseHandler.error(res, 'Points must be a whole number between 0 and 10000.', 400);
        }
        fields.points = parsed;
      }

      if (estimatedMinutes !== undefined) {
        const parsed = parseInt(estimatedMinutes, 10);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1440) {
          return ResponseHandler.error(res, 'Estimated minutes must be a whole number between 1 and 1440.', 400);
        }
        fields.estimated_minutes = parsed;
      }

      if (categorySlug !== undefined) {
        const category = await TaskModel.findCategoryBySlug(categorySlug);
        if (!category) {
          return ResponseHandler.error(res, `Unknown category "${categorySlug}".`, 400);
        }
        fields.category_id = category.id;
      }

      if (req.body.isComingSoon !== undefined) {
        fields.is_coming_soon = Boolean(req.body.isComingSoon);
      }

      const updated = await TaskModel.updateTask(id, fields);
      const task = await TaskModel.getTaskById(updated.id);

      if (req.logActivity) {
        await req.logActivity('Update Task', { taskId: task.id, title: task.title, changed: Object.keys(fields) });
      }

      return ResponseHandler.success(res, 'Task updated successfully.', task);
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const deletedTask = await TaskModel.deleteTask(id);

      if (!deletedTask) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      // Remove the backing HTML file so we don't leave orphans on disk
      let fileRemoved = false;
      try {
        fileRemoved = TaskService.deleteTaskHtmlFile(deletedTask.file_path);
      } catch (fileErr) {
        console.error('Failed to delete task HTML file:', fileErr.message);
      }

      if (req.logActivity) {
        await req.logActivity('Delete Task', { taskId: id, title: deletedTask.title, fileRemoved });
      }

      return ResponseHandler.success(res, 'Task deleted successfully.', { ...deletedTask, fileRemoved });
    } catch (err) {
      next(err);
    }
  }

  static async getEmailSettings(req, res, next) {
    try {
      const config = await EmailService.getConfig();
      // The password is never sent back to the browser. The client shows a
      // placeholder and only submits a new value when the admin types one.
      return ResponseHandler.success(res, 'Email settings fetched.', {
        enabled: config.enabled,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        passwordSet: Boolean(config.password),
        fromName: config.fromName,
        fromAddress: config.fromAddress,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEmailSettings(req, res, next) {
    try {
      const { enabled, host, port, secure, user, password, fromName, fromAddress } = req.body;
      const KEYS = EmailService.KEYS;
      const entries = {};

      if (enabled !== undefined) entries[KEYS.enabled] = Boolean(enabled);
      if (host !== undefined) entries[KEYS.host] = String(host).trim();
      if (secure !== undefined) entries[KEYS.secure] = Boolean(secure);
      if (user !== undefined) entries[KEYS.user] = String(user).trim();
      if (fromName !== undefined) entries[KEYS.fromName] = String(fromName).trim();

      if (port !== undefined) {
        const parsedPort = parseInt(port, 10);
        if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
          return ResponseHandler.error(res, 'Port must be a whole number between 1 and 65535.', 400);
        }
        entries[KEYS.port] = parsedPort;
      }

      if (fromAddress !== undefined) {
        const trimmed = String(fromAddress).trim();
        if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return ResponseHandler.error(res, `"${trimmed}" is not a valid email address.`, 400);
        }
        entries[KEYS.fromAddress] = trimmed;
      }

      // An empty password field means "leave the stored one alone".
      if (password !== undefined && String(password).length > 0) {
        entries[KEYS.password] = String(password);
      }

      // Turning sending on without the essentials would fail silently later.
      if (entries[KEYS.enabled] === true) {
        const current = await EmailService.getConfig();
        const host_ = entries[KEYS.host] !== undefined ? entries[KEYS.host] : current.host;
        const from_ = entries[KEYS.fromAddress] !== undefined ? entries[KEYS.fromAddress] : current.fromAddress;
        if (!host_ || !from_) {
          return ResponseHandler.error(res, 'Set an SMTP host and a from address before switching email on.', 400);
        }
      }

      await SettingsModel.setMany(entries, req.user ? req.user.id : null);

      if (req.logActivity) {
        // Never log the password value itself.
        await req.logActivity('Update Email Settings', {
          changed: Object.keys(entries).filter((k) => k !== KEYS.password),
          passwordChanged: Object.prototype.hasOwnProperty.call(entries, KEYS.password),
        });
      }

      const updated = await EmailService.getConfig();
      return ResponseHandler.success(res, 'Email settings saved.', {
        enabled: updated.enabled,
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        user: updated.user,
        passwordSet: Boolean(updated.password),
        fromName: updated.fromName,
        fromAddress: updated.fromAddress,
      });
    } catch (err) {
      next(err);
    }
  }

  static async testEmailSettings(req, res, next) {
    try {
      const { to } = req.body;
      const recipient = (to || (req.user && req.user.email) || '').trim();
      if (!recipient) {
        return ResponseHandler.error(res, 'Enter an address to send the test message to.', 400);
      }

      const config = await EmailService.getConfig();
      if (!config.host || !config.fromAddress) {
        return ResponseHandler.error(res, 'Save an SMTP host and a from address before sending a test.', 400);
      }

      try {
        await EmailService.verify(config);
        await EmailService.send(
          {
            to: recipient,
            subject: 'NerdLab test email',
            text: 'This is a test message from your NerdLab admin panel. Email is configured correctly.',
            html: '<p>This is a test message from your NerdLab admin panel. Email is configured correctly.</p>',
          },
          // Allow a test even while sending is still switched off.
          { ...config, enabled: true }
        );
      } catch (mailErr) {
        return ResponseHandler.error(res, `Test failed: ${mailErr.message}`, 400);
      }

      if (req.logActivity) {
        await req.logActivity('Send Test Email', { to: recipient });
      }

      return ResponseHandler.success(res, `Test email sent to ${recipient}.`);
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const { name, description, icon } = req.body;

      if (!name || !name.trim()) {
        return ResponseHandler.error(res, 'Category name is required.', 400);
      }

      const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      if (!slug) {
        return ResponseHandler.error(res, 'Category name must contain at least one letter or number.', 400);
      }

      const existing = await TaskModel.findCategoryBySlug(slug);
      if (existing) {
        return ResponseHandler.error(res, `A category with the slug "${slug}" already exists.`, 400);
      }

      const category = await TaskModel.createCategory({ name, description: description || '', icon: icon || null });

      if (req.logActivity) {
        await req.logActivity('Create Category', { categoryId: category.id, name: category.name, slug: category.slug });
      }

      return ResponseHandler.success(res, 'Category created successfully.', category, 201);
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const taskCount = await TaskModel.countTasksInCategory(id);
      if (taskCount > 0) {
        return ResponseHandler.error(
          res,
          `Cannot delete this category — it still has ${taskCount} task(s). Delete or reassign them first.`,
          400
        );
      }

      const deleted = await TaskModel.deleteCategory(id);
      if (!deleted) {
        return ResponseHandler.error(res, 'Category not found.', 404);
      }

      if (req.logActivity) {
        await req.logActivity('Delete Category', { categoryId: id, name: deleted.name });
      }

      return ResponseHandler.success(res, 'Category deleted successfully.', deleted);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AdminController;
