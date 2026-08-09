import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/progressService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  Award,
  CheckCircle2,
  Clock,
  Code2,
  TrendingUp,
  ArrowRight,
  Terminal,
  Trophy,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await progressService.getMyProgress();
        setProgressList(res.data);
      } catch (err) {
        console.error('Failed to load progress metrics:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const completedCount = progressList.filter((p) => p.status === 'completed').length;
  const totalPoints = progressList
    .filter((p) => p.status === 'completed')
    .reduce((acc, curr) => acc + (curr.points || 0), 0);

  if (loading) {
    return <LoadingSpinner fullPage label="Loading Student Dashboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl glass-panel p-8 border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <span>DevOps Student Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Track your practical DevOps exercise completion, points earned, and overall rank.
            </p>
          </div>

          <Link
            to="/tasks"
            className="px-6 py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 flex items-center space-x-2 transition-all"
          >
            <span>Continue Labs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Points</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{totalPoints} <span className="text-sm text-amber-400 font-normal">PTS</span></p>
          <span className="text-xs text-slate-400 block">Earned from lab completions</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Labs</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{completedCount} <span className="text-sm text-emerald-400 font-normal">Labs</span></p>
          <span className="text-xs text-slate-400 block">Out of {progressList.length} total opened</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leaderboard Rank</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">#1</p>
          <span className="text-xs text-purple-400 block font-medium">Top Student</span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Invested</span>
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {Math.round(progressList.reduce((acc, curr) => acc + (curr.time_spent_seconds || 0), 0) / 60)} <span className="text-sm text-sky-400 font-normal">Mins</span>
          </p>
          <span className="text-xs text-slate-400 block">Total hands-on lab time</span>
        </div>
      </div>

      {/* Recent Progress Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Recent Lab Activity</h3>
            <p className="text-sm text-slate-400">Your recent DevOps exercises and completion status</p>
          </div>
          <Link to="/tasks" className="text-xs text-sky-400 font-semibold hover:underline flex items-center space-x-1">
            <span>View All Labs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {progressList.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Terminal className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No lab exercises started yet.</p>
            <Link to="/tasks" className="inline-block px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold text-sm">
              Launch First Lab
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3">Task Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Time Spent</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {progressList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-white">{item.task_title}</td>
                    <td className="px-4 py-3.5 text-slate-400 text-xs">{item.category_name || 'General'}</td>
                    <td className="px-4 py-3.5">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold">
                          <Clock className="w-3 h-3" />
                          <span>In Progress</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">{item.attempts}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-xs">
                      {Math.floor(item.time_spent_seconds / 60)}m {item.time_spent_seconds % 60}s
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/tasks/${item.task_id}`}
                        className="px-3 py-1.5 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Launch
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DashboardPage;
