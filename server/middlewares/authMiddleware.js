const { verifyToken } = require('../config/jwt');
const UserModel = require('../models/userModel');
const ResponseHandler = require('../utils/responseHandler');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHandler.error(res, 'Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return ResponseHandler.error(res, 'User account no longer exists', 401);
    }

    if (!user.is_active) {
      return ResponseHandler.error(res, 'User account has been deactivated', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ResponseHandler.error(res, 'Authentication token has expired. Please login again.', 401);
    }
    return ResponseHandler.error(res, 'Invalid authentication token', 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return ResponseHandler.error(res, 'Access denied. Administrator privileges required.', 403);
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
