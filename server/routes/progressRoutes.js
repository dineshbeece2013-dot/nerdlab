const express = require('express');
const router = express.Router();
const ProgressController = require('../controllers/progressController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/open', ProgressController.openTask);
router.post('/complete', ProgressController.completeTask);
router.post('/time-spent', ProgressController.updateTimeSpent);
router.get('/my-progress', ProgressController.getMyProgress);

module.exports = router;
