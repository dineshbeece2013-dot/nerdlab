import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { certificateService } from '../services/certificateService';
import AlertBanner from '../components/common/AlertBanner';
import { User, Mail, Shield, Save, Camera, Award, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [notification, setNotification] = useState(null);
  const [saving, setSaving] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [certsLoading, setCertsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await certificateService.getMyCertificates();
        setCertificates(res.data);
      } catch (err) {
        // The profile form still works without them, so a failure here is not
        // worth an error banner over the whole page.
        console.error('Failed to load certificates:', err.message);
      } finally {
        setCertsLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      const res = await authService.updateProfile({
        name,
        bio,
        avatar_url: avatarUrl,
      });
      updateUserData(res.data);
      setNotification({ type: 'success', message: 'Profile updated successfully.' });
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account information and preferences</p>
      </div>

      {notification && (
        <AlertBanner type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      <div className="glass-panel rounded-3xl border border-slate-800 p-8 space-y-8">
        {/* Avatar Header */}
        <div className="flex items-center space-x-6 pb-6 border-b border-slate-800">
          <div className="relative group">
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={name}
              className="w-24 h-24 rounded-full ring-4 ring-sky-500/30 object-cover"
            />
            <div className="absolute inset-0 rounded-full bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-sm text-slate-400">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Avatar Image URL
            </label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Bio / Goals
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your DevOps learning goals..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Certificates earned — issued automatically when a lab that awards one
          is completed. */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">My Certificates</h2>
              <p className="text-xs text-slate-400">Earned by completing labs that award one</p>
            </div>
          </div>
          {certificates.length > 0 && (
            <Link to="/certificates" className="text-sm text-sky-400 hover:text-sky-300 font-semibold">
              View all
            </Link>
          )}
        </div>

        {certsLoading ? (
          <p className="text-sm text-slate-400">Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <p className="text-sm text-slate-400">
            No certificates yet.{' '}
            <Link to="/tasks" className="text-sky-400 hover:text-sky-300 font-semibold">
              Browse the labs
            </Link>{' '}
            to earn your first one.
          </p>
        ) : (
          <ul className="space-y-3">
            {certificates.map((cert) => (
              <li
                key={cert.id}
                className="flex items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{cert.title}</p>
                    <p className="text-xs text-slate-400 font-mono truncate">{cert.certificate_code}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
