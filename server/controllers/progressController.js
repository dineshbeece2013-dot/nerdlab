const ProgressModel = require('../models/progressModel');
const TaskModel = require('../models/taskModel');
const CertificateModel = require('../models/certificateModel');
const ResponseHandler = require('../utils/responseHandler');

class ProgressController {
  static async openTask(req, res, next) {
    try {
      const { taskId } = req.body;
      const userId = req.user.id;

      const task = await TaskModel.getTaskById(taskId);
      if (!task) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      if (task.is_coming_soon) {
        return ResponseHandler.error(res, 'This lab is coming soon and cannot be started yet.', 403);
      }

      const progress = await ProgressModel.recordOpenTask(userId, taskId);

      if (req.logActivity) {
        await req.logActivity('Open Task', { taskId: task.id, title: task.title, attempts: progress.attempts });
      }

      return ResponseHandler.success(res, 'Task access recorded.', progress);
    } catch (err) {
      next(err);
    }
  }

  static async completeTask(req, res, next) {
    try {
      const { taskId, score = 100, timeSpentSeconds = 0 } = req.body;
      const userId = req.user.id;

      const task = await TaskModel.getTaskById(taskId);
      if (!task) {
        return ResponseHandler.error(res, 'Task not found.', 404);
      }

      if (task.is_coming_soon) {
        return ResponseHandler.error(res, 'This lab is coming soon — no points can be awarded for it yet.', 403);
      }

      // Points are only awarded once — the task HTML signals completion after all
      // of its internal steps pass, and replaying that signal must not re-award.
      const existing = await ProgressModel.getUserTaskProgress(userId, taskId);
      const alreadyCompleted = !!existing && existing.status === 'completed';

      const progress = await ProgressModel.recordTaskCompletion(userId, taskId, score, timeSpentSeconds);

      // Labs flagged awards_certificate issue one on completion. issueForTask is
      // idempotent, so replaying the completion signal never mints a second code.
      let certificate = null;
      let certificateIsNew = false;
      if (task.awards_certificate) {
        const issued = await CertificateModel.issueForTask(userId, task, req.user.name);
        certificate = issued.certificate;
        certificateIsNew = issued.isNew;
      }

      if (req.logActivity && !alreadyCompleted) {
        await req.logActivity('Complete Task', {
          taskId: task.id,
          title: task.title,
          pointsEarned: task.points,
          timeSpentSeconds,
        });
      }

      if (req.logActivity && certificateIsNew) {
        await req.logActivity('Issue Certificate', {
          taskId: task.id,
          title: task.title,
          certificateCode: certificate.certificate_code,
        });
      }

      return ResponseHandler.success(
        res,
        alreadyCompleted ? 'Task already completed — progress updated.' : 'All steps complete! Points awarded.',
        {
          progress,
          pointsEarned: alreadyCompleted ? 0 : task.points,
          alreadyCompleted,
          certificate,
          certificateIsNew,
        }
      );
    } catch (err) {
      next(err);
    }
  }

  static async updateTimeSpent(req, res, next) {
    try {
      const { taskId, timeSpentSeconds } = req.body;
      const userId = req.user.id;

      const progress = await ProgressModel.updateTimeSpent(userId, taskId, timeSpentSeconds);
      return ResponseHandler.success(res, 'Time spent updated.', progress);
    } catch (err) {
      next(err);
    }
  }

  static async getMyProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const progress = await ProgressModel.getUserProgress(userId);
      return ResponseHandler.success(res, 'Student progress history fetched.', progress);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProgressController;
