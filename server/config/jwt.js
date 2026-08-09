const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_antigravity_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'reset_secret_key_antigravity_2026';

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const generateResetToken = (payload) => {
  return jwt.sign(payload, JWT_RESET_SECRET, { expiresIn: '1h' });
};

const verifyResetToken = (token) => {
  return jwt.verify(token, JWT_RESET_SECRET);
};

module.exports = {
  generateToken,
  verifyToken,
  generateResetToken,
  verifyResetToken,
};
