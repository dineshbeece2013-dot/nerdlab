import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  Activity,
  ArrowLeft,
  Search,
  Globe,
  Monitor,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 25;

const ACTION_COLORS = {
  LOGIN: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  LOGOUT: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  REGISTER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'TASK_OPEN': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'TASK_COMPLETE': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'UPLOAD_TASK': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'TOGGLE_STATUS': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  DEFAULT: 'text-slate-400 bg-slate-700/30 border-slate-600/20',
};

const getActionColor = (action) => {
  if (!action) return ACTION_COLORS.DEFAULT;
  const key = Object.keys(ACTION_COLORS).find((k) =>
    action.toUpperCase().includes(k)
  );
  return key ? ACTION_COLORS[key] : ACTION_COLORS.DEFAULT;
};

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [inputFilter, setInputFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getActivityLogs({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        action: filterAction || undefined,
      });
      setLogs(res.data?.logs || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load activity logs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(0);
    setFilterAction(inputFilter.trim().toUpperCase());
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/admin"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Admin · Audit Logs</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Activity Audit Logs</h1>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl border border-slate-800 p-4 flex items-center space-x-3">
          <Activity className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Events</p>
            <p className="text-xl font-extrabold text-white">{total.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl border border-slate-800 p-4 flex items-center space-x-3">
          <Globe className="w-5 h-5 text-sky-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Current Page</p>
            <p className="text-xl font-extrabold text-white">{page + 1} of {totalPages || 1}</p>
          </div>
        </div>
        <div className="glass-panel rounded-xl border border-slate-800 p-4 flex items-center space-x-3">
          <Filter className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Filter</p>
            <p className="text-sm font-bold text-white truncate">{filterAction || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <form onSubmit={handleFilter} className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={inputFilter}
            onChange={(e) => setInputFilter(e.target.value)}
            placeholder="Filter by action (e.g. LOGIN, TASK_COMPLETE)"
            className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all text-sm"
        >
          Apply
        </button>
        {filterAction && (
          <button
            type="button"
            onClick={() => { setInputFilter(''); setFilterAction(''); setPage(0); }}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-500">
            <Activity className="w-10 h-10" />
            <p className="font-medium">No logs found{filterAction ? ` for action "${filterAction}"` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 bg-slate-900/60">
                <tr>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">
                    <span className="flex items-center space-x-1">
                      <Globe className="w-3.5 h-3.5" /><span>IP Address</span>
                    </span>
                  </th>
                  <th className="px-5 py-4">
                    <span className="flex items-center space-x-1">
                      <Monitor className="w-3.5 h-3.5" /><span>Browser / OS</span>
                    </span>
                  </th>
                  <th className="px-5 py-4">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" /><span>Duration</span>
                    </span>
                  </th>
                  <th className="px-5 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded border text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{log.user_email || <span className="text-slate-600 italic">Guest</span>}</td>
                    <td className="px-5 py-3 text-slate-400">{log.ip_address || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 max-w-[200px] truncate">
                      {log.browser ? `${log.browser}` : '—'}
                      {log.operating_system ? <span className="text-slate-600"> / {log.operating_system}</span> : ''}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {log.duration_seconds != null ? `${log.duration_seconds}s` : '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} events
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-semibold text-white">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityLogs;
