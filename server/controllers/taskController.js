const TaskModel = require('../models/taskModel');
const TaskService = require('../services/taskService');
const ProgressModel = require('../models/progressModel');
const ResponseHandler = require('../utils/responseHandler');

class TaskController {
  static async getCategories(req, res, next) {
    try {
      const categories = await TaskModel.getAllCategories();
      return ResponseHandler.success(res, 'Task categories fetched successfully.', categories);
    } catch (err) {
      next(err);
    }
  }

  static async getTasks(req, res, next) {
    try {
      const { category, difficulty, search } = req.query;
      const tasks = await TaskModel.getAllTasks({
        categorySlug: category,
        difficulty,
        search,
      });

      // If user is authenticated, attach user's task status
      let userProgressMap = {};
      if (req.user) {
        const userProgress = await ProgressModel.getUserProgress(req.user.id);
        userProgressMap = userProgress.reduce((acc, curr) => {
          acc[curr.task_id] = curr;
          return acc;
        }, {});
      }

      const enrichedTasks = tasks.map((task) => ({
        ...task,
        userProgress: userProgressMap[task.id] || null,
      }));

      return ResponseHandler.success(res, 'Tasks list fetched successfully.', enrichedTasks);
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await TaskModel.getTaskById(id);
      if (!task) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      let progress = null;
      if (req.user) {
        progress = await ProgressModel.getUserTaskProgress(req.user.id, task.id);
      }

      // Tell the client where to load the lab from: a bundle is served
      // statically, a single file is sent inline by /content (ADR-010).
      const lab = TaskService.resolveLab(task.file_path);
      task.lab_kind = lab.kind;
      task.lab_url = lab.kind === 'bundle' ? lab.url : `/api/tasks/${task.id}/content`;

      return ResponseHandler.success(res, 'Task details fetched.', { task, progress });
    } catch (err) {
      next(err);
    }
  }

  static async getTaskHtmlContent(req, res, next) {
    try {
      const { id } = req.params;
      const task = await TaskModel.getTaskById(id);
      if (!task) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      if (task.is_coming_soon) {
        return ResponseHandler.error(res, 'This lab is coming soon and cannot be opened yet.', 403);
      }

      // A bundle cannot be inlined — its assets are relative. Send the caller
      // to the static URL instead of returning a broken page.
      const lab = TaskService.resolveLab(task.file_path);
      if (lab.kind === 'bundle') {
        return res.redirect(302, lab.url);
      }

      const htmlContent = TaskService.getTaskHtmlContent(task.file_path);

      if (req.user && req.logActivity) {
        await req.logActivity('Open Task HTML', { taskId: task.id, title: task.title });
      }

      return res.type('html').send(htmlContent);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = TaskController;
