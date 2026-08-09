const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/authValidator');
const { authRateLimiter } = require('../middlewares/rateLimiter');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/register', authRateLimiter, registerValidation, AuthController.register);
router.post('/login', authRateLimiter, loginValidation, AuthController.login);
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidation, AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, resetPasswordValidation, AuthController.resetPassword);

module.exports = router;
