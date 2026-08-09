const nodemailer = require('nodemailer');
const SettingsModel = require('../models/settingsModel');

const KEYS = {
  enabled: 'email.enabled',
  host: 'email.host',
  port: 'email.port',
  secure: 'email.secure',
  user: 'email.user',
  password: 'email.password',
  fromName: 'email.from_name',
  fromAddress: 'email.from_address',
};

/**
 * SMTP delivery driven by settings an admin edits in the panel, so mail can be
 * configured on a running instance without a redeploy. Falls back to the
 * matching EMAIL_* environment variables when a setting has never been saved.
 */
class EmailService {
  static get KEYS() {
    return KEYS;
  }

  static async getConfig() {
    const stored = await SettingsModel.getByPrefix('email.');
    const pick = (key, envName) => {
      const value = stored[key];
      return value === undefined || value === null || value === '' ? process.env[envName] || '' : value;
    };

    return {
      enabled: String(pick(KEYS.enabled, 'EMAIL_ENABLED')).toLowerCase() === 'true',
      host: pick(KEYS.host, 'EMAIL_HOST'),
      port: parseInt(pick(KEYS.port, 'EMAIL_PORT') || '587', 10),
      secure: String(pick(KEYS.secure, 'EMAIL_SECURE')).toLowerCase() === 'true',
      user: pick(KEYS.user, 'EMAIL_USER'),
      password: pick(KEYS.password, 'EMAIL_PASSWORD'),
      fromName: pick(KEYS.fromName, 'EMAIL_FROM_NAME') || 'NerdLab Learning Platform',
      fromAddress: pick(KEYS.fromAddress, 'EMAIL_FROM_ADDRESS'),
    };
  }

  /** True when mail is switched on and has the minimum it needs to connect. */
  static async isConfigured() {
    const config = await this.getConfig();
    return Boolean(config.enabled && config.host && config.fromAddress);
  }

  static buildTransport(config) {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
  }

  static async verify(overrides = null) {
    const config = overrides || (await this.getConfig());
    if (!config.host) throw new Error('SMTP host is not set.');
    if (!config.fromAddress) throw new Error('From address is not set.');

    const transport = this.buildTransport(config);
    await transport.verify();
    return true;
  }

  static async send({ to, subject, text, html }, overrides = null) {
    const config = overrides || (await this.getConfig());
    if (!config.enabled) throw new Error('Email sending is switched off in the admin panel.');
    if (!config.host) throw new Error('SMTP host is not set.');
    if (!config.fromAddress) throw new Error('From address is not set.');

    const transport = this.buildTransport(config);
    return transport.sendMail({
      from: `"${config.fromName}" <${config.fromAddress}>`,
      to,
      subject,
      text,
      html,
    });
  }

  static passwordResetTemplate({ name, resetUrl, token, expiresMinutes }) {
    const safeName = name || 'there';
    const text =
      `Hi ${safeName},\n\n` +
      `Someone asked to reset the password for your NerdLab account.\n\n` +
      `Open this link to choose a new password:\n${resetUrl}\n\n` +
      `If the link does not work, paste this code into the reset form:\n${token}\n\n` +
      `The link expires in ${expiresMinutes} minutes. If you did not ask for this, ignore this email — nothing will change.\n\n` +
      `— NerdLab Learning Platform`;

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;background:#0f172a;padding:32px;color:#e2e8f0">
        <div style="max-width:520px;margin:0 auto;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:28px">
          <h1 style="color:#38bdf8;font-size:20px;margin:0 0 16px">Reset your password</h1>
          <p style="margin:0 0 14px">Hi ${safeName},</p>
          <p style="margin:0 0 14px">Someone asked to reset the password for your NerdLab account.</p>
          <p style="margin:0 0 22px">
            <a href="${resetUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:8px">Choose a new password</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">If the button does not work, paste this code into the reset form:</p>
          <p style="margin:0 0 22px;font-family:monospace;font-size:13px;background:#0b1220;border:1px solid #334155;border-radius:6px;padding:10px;word-break:break-all;color:#a5f3fc">${token}</p>
          <p style="margin:0;font-size:13px;color:#94a3b8">
            The link expires in ${expiresMinutes} minutes. If you did not ask for this, ignore this email — nothing will change.
          </p>
        </div>
      </div>`;

    return { text, html };
  }
}

module.exports = EmailService;
