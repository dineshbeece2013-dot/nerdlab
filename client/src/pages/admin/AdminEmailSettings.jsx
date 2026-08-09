import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertBanner from '../../components/common/AlertBanner';
import { ArrowLeft, Mail, Save, Send, ShieldCheck, Server, AtSign } from 'lucide-react';

const PRESETS = [
  { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, secure: false },
  { label: 'Microsoft 365 / Outlook', host: 'smtp.office365.com', port: 587, secure: false },
  { label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, secure: false },
  { label: 'Amazon SES (eu-west-1)', host: 'email-smtp.eu-west-1.amazonaws.com', port: 587, secure: false },
  { label: 'Mailtrap (testing)', host: 'sandbox.smtp.mailtrap.io', port: 2525, secure: false },
];

const AdminEmailSettings = () => {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [passwordSet, setPasswordSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminService.getEmailSettings();
        const d = res.data || {};
        setForm({
          enabled: !!d.enabled,
          host: d.host || '',
          port: String(d.port || 587),
          secure: !!d.secure,
          user: d.user || '',
          password: '',
          fromName: d.fromName || 'NerdLab Learning Platform',
          fromAddress: d.fromAddress || '',
        });
        setPasswordSet(!!d.passwordSet);
      } catch (err) {
        setAlert({ type: 'error', message: err.message || 'Failed to load email settings.' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.email && !testTo) setTestTo(user.email);
  }, [user, testTo]);

  const applyPreset = (preset) => {
    setForm((f) => ({ ...f, host: preset.host, port: String(preset.port), secure: preset.secure }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlert(null);
    try {
      const payload = { ...form, port: form.port };
      // An empty password box means "keep the stored one".
      if (!payload.password) delete payload.password;

      const res = await adminService.updateEmailSettings(payload);
      const d = res.data || {};
      setPasswordSet(!!d.passwordSet);
      setForm((f) => ({ ...f, password: '' }));
      setAlert({ type: 'success', message: res.message || 'Email settings saved.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save email settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setAlert(null);
    try {
      const res = await adminService.sendTestEmail(testTo);
      setAlert({ type: 'success', message: res.message || 'Test email sent.' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Test email failed.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading || !form) {
    return <LoadingSpinner fullPage label="Loading email settings..." />;
  }

  const inputClass =
    'w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all';
  const labelClass = 'text-xs font-semibold text-slate-400 uppercase tracking-wider';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/admin"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Mail className="w-3.5 h-3.5" />
            <span>Admin · Email</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Email Configuration</h1>
        </div>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="glass-panel rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">
        These details are used to send password reset emails. Until email is switched on and working,
        students cannot reset their own passwords.
      </div>

      <form onSubmit={handleSave} className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
        {/* Master switch */}
        <label className="flex items-start space-x-3 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
          />
          <span className="text-sm">
            <span className="font-semibold text-white">Send emails from this platform</span>
            <span className="block text-xs text-slate-500 mt-0.5">
              Turn this on once the settings below are correct. You can send a test first.
            </span>
          </span>
        </label>

        {/* Presets */}
        <div className="space-y-2">
          <span className={labelClass}>Quick fill</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-sky-500/50 hover:text-white transition-all"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Server */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Server className="w-4 h-4 text-sky-400" />
            <span>Mail server</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="host" className={labelClass}>SMTP host</label>
              <input
                id="host"
                type="text"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                placeholder="smtp.gmail.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="port" className={labelClass}>Port</label>
              <input
                id="port"
                type="number"
                min="1"
                max="65535"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <label className="flex items-start space-x-3 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.secure}
              onChange={(e) => setForm({ ...form, secure: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-slate-600 bg-slate-900 text-sky-500 focus:ring-sky-500/50"
            />
            <span>
              <span className="text-slate-200">Use TLS from the start (SSL)</span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Tick this for port 465. Leave it off for 587 or 2525, which upgrade to TLS after connecting.
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="user" className={labelClass}>Username</label>
              <input
                id="user"
                type="text"
                autoComplete="off"
                value={form.user}
                onChange={(e) => setForm({ ...form, user: e.target.value })}
                placeholder="apikey / you@example.com"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className={labelClass}>Password</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={passwordSet ? '•••••••• (unchanged)' : 'App password or API key'}
                className={inputClass}
              />
              <p className="text-[11px] text-slate-500">
                {passwordSet
                  ? 'A password is stored. Leave this blank to keep it.'
                  : 'No password stored yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Sender */}
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <AtSign className="w-4 h-4 text-emerald-400" />
            <span>Who the email comes from</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="fromName" className={labelClass}>Sender name</label>
              <input
                id="fromName"
                type="text"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                placeholder="NerdLab Learning Platform"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="fromAddress" className={labelClass}>Sender address</label>
              <input
                id="fromAddress"
                type="email"
                value={form.fromAddress}
                onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
                placeholder="no-reply@nerdlab.io"
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Test */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Send a test</span>
        </h2>
        <p className="text-sm text-slate-400">
          Saves nothing — this connects to the mail server using the saved settings and sends one
          message, so you can confirm it works before switching sending on.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="you@example.com"
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || !testTo}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{testing ? 'Sending...' : 'Send Test Email'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEmailSettings;
