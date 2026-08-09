const LeaderboardModel = require('../models/leaderboardModel');
const ResponseHandler = require('../utils/responseHandler');

class LeaderboardController {
  static async getLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);

      const result = await LeaderboardModel.getLeaderboard({ limit, offset });

      let userRank = null;
      if (req.user) {
        userRank = await LeaderboardModel.getUserRank(req.user.id);
      }

      if (req.logActivity) {
        await req.logActivity('Visit Leaderboard', { userId: req.user ? req.user.id : null });
      }

      return ResponseHandler.success(res, 'Leaderboard fetched successfully.', {
        leaderboard: result.leaderboard,
        total: result.total,
        currentUserRank: userRank,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = LeaderboardController;
