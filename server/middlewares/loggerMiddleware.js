const useragent = require('useragent');
const LogModel = require('../models/logModel');
const { getClientIp } = require('../utils/clientIp');

const loggerMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const source = req.headers['user-agent'] || '';
  const agent = useragent.parse(source);

  // Reading x-forwarded-for directly used to store the whole proxy chain
  // ("1.2.3.4, 127.0.0.1") in a VARCHAR(45) column, which is both wrong and
  // long enough to fail the insert once IPv6 is involved.
  const ipAddress = getClientIp(req);

  req.clientInfo = {
    ipAddress,
    userAgent: source,
    browser: `${agent.family} ${agent.major}.${agent.minor}`,
    operatingSystem: agent.os.toString(),
  };

  // Helper method to explicitly log activities from controllers or routes
  req.logActivity = async (action, details = {}) => {
    try {
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const userId = req.user ? req.user.id : null;
      await LogModel.createActivityLog({
        userId,
        action,
        details,
        ipAddress: req.clientInfo.ipAddress,
        browser: req.clientInfo.browser,
        operatingSystem: req.clientInfo.operatingSystem,
        userAgent: req.clientInfo.userAgent,
        durationSeconds,
      });
    } catch (err) {
      console.error('Failed to capture activity log:', err.message);
    }
  };

  next();
};

module.exports = loggerMiddleware;
