const express = require('express');
const router = express.Router();
const LogController = require('../controllers/logController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/activity', authenticateToken, requireAdmin, LogController.getActivityLogs);
router.get('/login-history', authenticateToken, LogController.getLoginHistory);

module.exports = router;
