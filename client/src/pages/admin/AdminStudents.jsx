import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertBanner from '../../components/common/AlertBanner';
import {
  Users,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldOff,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE = 20;

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [page, setPage] = useState(0);
  const [alert, setAlert] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getStudents({
        search,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setStudents(res.data?.students || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load students.' });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setSearch(inputValue.trim());
  };

  const handleToggleStatus = async (student) => {
    setTogglingId(student.id);
    setAlert(null);
    try {
      await adminService.toggleStudentStatus(student.id, !student.is_active);
      setStudents((prev) =>
        prev.map((s) => s.id === student.id ? { ...s, is_active: !s.is_active } : s)
      );
      setAlert({
        type: 'success',
        message: `${student.name}'s account has been ${!student.is_active ? 'activated' : 'deactivated'}.`,
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update student status.' });
    } finally {
      setTogglingId(null);
    }
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
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Admin · Students</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Student Directory</h1>
        </div>
      </div>

      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all text-sm"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setInputValue(''); setSearch(''); setPage(0); }}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all text-sm"
          >
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading students..." />
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-500">
            <Users className="w-10 h-10" />
            <p className="font-medium">No students found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 bg-slate-900/60">
                <tr>
                  <th className="px-5 py-4">Student</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4 text-center">Points</th>
                  <th className="px-5 py-4 text-center">Completions</th>
                  <th className="px-5 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {student.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-semibold text-white">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">{student.email}</td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-amber-400">{student.total_points || 0}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="font-semibold">{student.completed_tasks || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {student.is_active ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(student)}
                        disabled={togglingId === student.id}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          student.is_active
                            ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {student.is_active ? (
                          <><ShieldOff className="w-3.5 h-3.5" /><span>Deactivate</span></>
                        ) : (
                          <><Shield className="w-3.5 h-3.5" /><span>Activate</span></>
                        )}
                      </button>
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
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} students
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

export default AdminStudents;
