const { body, validationResult } = require('express-validator');
const ResponseHandler = require('../utils/responseHandler');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseHandler.error(
      res,
      'Validation failed',
      400,
      errors.array().map((err) => ({ field: err.path, message: err.msg }))
    );
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate,
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  validate,
];

const resetPasswordValidation = [
  body('token').notEmpty().withMessage('Password reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
