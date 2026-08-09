const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middlewares/authMiddleware');

router.use(authenticateToken, requireAdmin);

router.get('/analytics', AdminController.getDashboardAnalytics);
router.get('/students', AdminController.getStudents);
router.put('/students/:id/status', AdminController.toggleStudentStatus);
router.post('/tasks/upload', AdminController.uploadTask);
router.put('/tasks/:id', AdminController.updateTask);
router.delete('/tasks/:id', AdminController.deleteTask);
router.post('/categories', AdminController.createCategory);
router.delete('/categories/:id', AdminController.deleteCategory);
router.get('/settings/email', AdminController.getEmailSettings);
router.put('/settings/email', AdminController.updateEmailSettings);
router.post('/settings/email/test', AdminController.testEmailSettings);

module.exports = router;
