const UserModel = require('../models/userModel');
const ProgressModel = require('../models/progressModel');
const LeaderboardModel = require('../models/leaderboardModel');
const ResponseHandler = require('../utils/responseHandler');

class UserController {
  static async getProfile(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      const rankInfo = await LeaderboardModel.getUserRank(req.user.id);
      const progress = await ProgressModel.getUserProgress(req.user.id);

      if (req.logActivity) {
        await req.logActivity('Visit Dashboard', { userId: req.user.id });
      }

      return ResponseHandler.success(res, 'Student profile and progress overview fetched.', {
        user,
        stats: {
          total_points: rankInfo.total_points || 0,
          tasks_completed: rankInfo.tasks_completed || 0,
          rank: rankInfo.rank || 0,
          total_opened_tasks: progress.length,
        },
        recentProgress: progress.slice(0, 5),
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name, bio, avatar_url } = req.body;
      const updatedUser = await UserModel.updateProfile(req.user.id, {
        name,
        bio,
        avatarUrl: avatar_url,
      });

      if (req.logActivity) {
        await req.logActivity('Update Profile', { userId: req.user.id });
      }

      return ResponseHandler.success(res, 'Profile updated successfully.', updatedUser);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
