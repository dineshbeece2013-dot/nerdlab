const LogModel = require('../models/logModel');
const ResponseHandler = require('../utils/responseHandler');

class LogController {
  static async getActivityLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '100', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const { action, userId } = req.query;

      const result = await LogModel.getActivityLogs({
        limit,
        offset,
        action,
        userId: userId ? parseInt(userId, 10) : null,
      });

      return ResponseHandler.success(res, 'Activity logs fetched successfully.', result);
    } catch (err) {
      next(err);
    }
  }

  static async getLoginHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const history = await LogModel.getLoginHistory(userId);
      return ResponseHandler.success(res, 'Login history fetched.', history);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LogController;
