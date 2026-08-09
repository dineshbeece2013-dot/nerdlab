import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Users,
  Code2,
  CheckCircle2,
  ShieldAlert,
  Upload,
  Activity,
  ArrowRight,
  Database,
  Terminal,
  Trash2,
  Mail,
} from 'lucide-react';

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminService.getAnalytics();
        setAnalytics(res.data);
      } catch (err) {
        console.error('Failed to load admin analytics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage label="Loading Admin Suite..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl glass-panel p-8 border border-amber-500/30 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Administrator Suite</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Administration</h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Manage student accounts, upload new HTML task exercises, and monitor audit activity logs.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/admin/tasks/upload"
              className="px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Task HTML</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Students</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.totalStudents || 0}</p>
          <Link to="/admin/students" className="text-xs text-sky-400 hover:underline inline-flex items-center space-x-1 font-semibold">
            <span>Manage Directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Lab Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.totalTasks || 0}</p>
          <Link to="/admin/tasks/upload" className="text-xs text-purple-400 hover:underline inline-flex items-center space-x-1 font-semibold">
            <span>Upload New Task</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Completions</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{analytics?.totalCompletions || 0}</p>
          <span className="text-xs text-slate-400 block">Recorded in PostgreSQL</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Status</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-emerald-400">PostgreSQL Connected</p>
          <span className="text-xs text-slate-400 block">Normalized 13 Schema Tables</span>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Link
          to="/admin/students"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-sky-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">Manage Students</h3>
          <p className="text-sm text-slate-400">View student accounts, search by email/name, and toggle active/inactive access.</p>
        </Link>

        <Link
          to="/admin/tasks/upload"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-purple-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Upload Task HTML</h3>
          <p className="text-sm text-slate-400">Create new lab exercises, write or paste raw HTML content, and assign points.</p>
        </Link>

        <Link
          to="/admin/tasks"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-red-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">Manage Tasks</h3>
          <p className="text-sm text-slate-400">Browse every lab, delete tasks along with their HTML files, and add or remove categories.</p>
        </Link>

        <Link
          to="/admin/logs"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Activity Audit Logs</h3>
          <p className="text-sm text-slate-400">Inspect security events, client IP addresses, User-Agent browser headers, and lab durations.</p>
        </Link>

        <Link
          to="/admin/settings/email"
          className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">Email Configuration</h3>
          <p className="text-sm text-slate-400">Set the SMTP server used for password reset emails, then send a test to confirm it works.</p>
        </Link>
      </div>

      {/* Recent System Activity Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Recent Security Audit Logs</h3>
          </div>
          <Link to="/admin/logs" className="text-xs text-sky-400 font-semibold hover:underline flex items-center space-x-1">
            <span>View Full Audit Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">IP Address</th>
                <th className="px-4 py-3">Browser / OS</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {analytics?.recentActivityLogs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-bold text-sky-400">{log.action}</td>
                  <td className="px-4 py-3 text-slate-200">{log.user_email || 'Guest / Unauthenticated'}</td>
                  <td className="px-4 py-3 text-slate-400">{log.ip_address}</td>
                  <td className="px-4 py-3 text-slate-400">{log.browser} ({log.operating_system})</td>
                  <td className="px-4 py-3 text-right text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
