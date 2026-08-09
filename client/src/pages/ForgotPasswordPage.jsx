import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import AlertBanner from '../components/common/AlertBanner';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, Inbox } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request Email, 2: Reset Form, 3: Done
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Arriving from the link in the reset email jumps straight to the new-password form.
  useEffect(() => {
    const tokenFromLink = searchParams.get('token');
    if (tokenFromLink) {
      setResetToken(tokenFromLink);
      setEmailSent(true);
      setStep(2);
    }
  }, [searchParams]);

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message);
      // When email is configured the token is only ever sent by email, never
      // returned here — the learner pastes it back or follows the link.
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setEmailSent(res.data?.emailSent !== false);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request a password reset.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const res = await authService.resetPassword(resetToken, newPassword);
      setMessage(res.message);
      setStep(3); // Success
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-6 glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 p-3 mx-auto flex items-center justify-center">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
          <p className="text-sm text-slate-400">Recover access to your NerdLab account</p>
        </div>

        {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
        {message && <AlertBanner type="success" message={message} onClose={() => setMessage('')} />}

        {step === 1 && (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Registered Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@devops.platform"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Email Me A Reset Link'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {emailSent && (
              <div className="flex items-start space-x-3 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
                <Inbox className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-sky-200">
                  Check your inbox. Open the link in the email, or paste the code from it below.
                  The code stops working after an hour.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Reset Code
              </label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste the code from your email"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 p-3 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300">Your password has been successfully updated!</p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl"
            >
              Proceed to Sign In
            </Link>
          </div>
        )}

        <div className="text-center pt-2">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
