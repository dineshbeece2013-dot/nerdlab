const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const UserModel = require('../models/userModel');
const LogModel = require('../models/logModel');
const LeaderboardModel = require('../models/leaderboardModel');
const { generateToken } = require('../config/jwt');
const EmailService = require('../services/emailService');
const ResponseHandler = require('../utils/responseHandler');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return ResponseHandler.error(res, 'An account with this email address already exists.', 400);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create Student user
      const user = await UserModel.create({
        name,
        email,
        passwordHash,
        role: 'student',
      });

      // Generate JWT Token
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      // Log Registration Activity
      if (req.logActivity) {
        req.user = user;
        await req.logActivity('Register', { email: user.email, name: user.name });
      }

      return ResponseHandler.success(
        res,
        'Student account registered successfully.',
        {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar_url: user.avatar_url,
            bio: user.bio,
          },
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return ResponseHandler.error(res, 'Invalid email address or password.', 401);
      }

      if (!user.is_active) {
        return ResponseHandler.error(res, 'Your account has been deactivated. Please contact support.', 403);
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await LogModel.recordLoginHistory({
          userId: user.id,
          ipAddress: req.clientInfo ? req.clientInfo.ipAddress : '127.0.0.1',
          userAgent: req.clientInfo ? req.clientInfo.userAgent : '',
          browser: req.clientInfo ? req.clientInfo.browser : '',
          operatingSystem: req.clientInfo ? req.clientInfo.operatingSystem : '',
          status: 'failed',
        });
        return ResponseHandler.error(res, 'Invalid email address or password.', 401);
      }

      // Record successful login history
      await LogModel.recordLoginHistory({
        userId: user.id,
        ipAddress: req.clientInfo ? req.clientInfo.ipAddress : '127.0.0.1',
        userAgent: req.clientInfo ? req.clientInfo.userAgent : '',
        browser: req.clientInfo ? req.clientInfo.browser : '',
        operatingSystem: req.clientInfo ? req.clientInfo.operatingSystem : '',
        status: 'success',
      });

      // Generate Token
      const token = generateToken({ id: user.id, email: user.email, role: user.role });

      // Log Login Activity
      if (req.logActivity) {
        req.user = user;
        await req.logActivity('Login', { email: user.email });
      }

      return ResponseHandler.success(res, 'Login successful.', {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          bio: user.bio,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCurrentUser(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      const rankInfo = await LeaderboardModel.getUserRank(req.user.id);

      if (req.logActivity) {
        await req.logActivity('Visit Profile', { userId: req.user.id });
      }

      return ResponseHandler.success(res, 'User profile fetched successfully.', {
        user,
        stats: {
          total_points: rankInfo.total_points || 0,
          tasks_completed: rankInfo.tasks_completed || 0,
          rank: rankInfo.rank || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req, res, next) {
    // Always answer the same way, whether or not the address is registered,
    // so this endpoint cannot be used to discover who has an account.
    const NEUTRAL = 'If an account with that email exists, a reset link is on its way. Check your inbox and your spam folder.';

    try {
      const { email } = req.body;
      const mailConfigured = await EmailService.isConfigured();

      // Check the mail server before looking the account up. Doing it in this
      // order means a broken mail server produces the same answer for every
      // address, so the error cannot be used to tell which accounts exist.
      if (mailConfigured) {
        try {
          await EmailService.verify();
        } catch (verifyErr) {
          console.error('Password reset unavailable — SMTP verify failed:', verifyErr.message);
          return ResponseHandler.error(
            res,
            'Password reset is temporarily unavailable. Please try again later or contact an administrator.',
            503
          );
        }
      }

      const user = await UserModel.findByEmail(email);

      if (!user) {
        return ResponseHandler.success(res, NEUTRAL, { emailSent: mailConfigured });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresMinutes = 60;
      const expiresAt = new Date(Date.now() + expiresMinutes * 60000);

      await UserModel.createPasswordResetToken(user.id, resetToken, expiresAt);

      if (req.logActivity) {
        req.user = user;
        await req.logActivity('Forgot Password Request', { email: user.email });
      }

      if (mailConfigured) {
        const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
        const resetUrl = `${clientUrl}/forgot-password?token=${resetToken}`;
        const { text, html } = EmailService.passwordResetTemplate({
          name: user.name,
          resetUrl,
          token: resetToken,
          expiresMinutes,
        });

        try {
          await EmailService.send({ to: user.email, subject: 'Reset your NerdLab password', text, html });
        } catch (mailErr) {
          // The server answered verify() a moment ago, so this is unusual.
          // Still answer neutrally: a different reply here would reveal that
          // this particular address has an account.
          console.error('Password reset email failed:', mailErr.message);
          if (req.logActivity) {
            await req.logActivity('Password Reset Email Failed', { email: user.email, error: mailErr.message });
          }
        }

        return ResponseHandler.success(res, NEUTRAL, { emailSent: true });
      }

      // No mail configured. Handing the token back over HTTP would let anyone
      // reset anyone's password, so only do it outside production and say so.
      if (process.env.NODE_ENV === 'production') {
        return ResponseHandler.error(
          res,
          'Password reset is unavailable because email has not been configured. Please contact an administrator.',
          503
        );
      }

      return ResponseHandler.success(
        res,
        'Email is not configured, so the reset code is shown below. Configure SMTP in the admin panel to email it instead.',
        { emailSent: false, resetToken }
      );
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const resetRecord = await UserModel.findValidPasswordResetToken(token);
      if (!resetRecord) {
        return ResponseHandler.error(res, 'Invalid or expired password reset token.', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await UserModel.updatePassword(resetRecord.user_id, passwordHash);
      await UserModel.markTokenUsed(resetRecord.id);

      const user = await UserModel.findById(resetRecord.user_id);

      if (req.logActivity && user) {
        req.user = user;
        await req.logActivity('Password Reset Completed', { userId: user.id });
      }

      return ResponseHandler.success(res, 'Password has been reset successfully. You can now login with your new password.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuthController;
