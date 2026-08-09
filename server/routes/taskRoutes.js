const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Public / Optional Auth routes
router.get('/categories', TaskController.getCategories);
router.get('/', TaskController.getTasks);
router.get('/:id', TaskController.getTaskById);

// Stream Task HTML for rendering in iframe
router.get('/:id/content', TaskController.getTaskHtmlContent);

module.exports = router;
