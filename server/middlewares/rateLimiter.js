const rateLimit = require('express-rate-limit');
const { getClientIp } = require('../utils/clientIp');

// Behind nginx (and a Cloudflare Tunnel) the socket address is always
// 127.0.0.1, which would put every visitor in one shared bucket — 20 failed
// logins from anyone would lock out the whole site. Key on the real client
// instead.
const keyGenerator = (req) => getClientIp(req);

// Strict Rate Limiter for Login/Register to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
  },
});

// General API Rate Limiter
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again later.',
  },
});

module.exports = {
  authRateLimiter,
  apiRateLimiter,
};
