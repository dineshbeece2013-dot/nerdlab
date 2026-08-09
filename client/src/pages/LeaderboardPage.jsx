import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../services/leaderboardService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Trophy, Award, CheckCircle2, Medal, User } from 'lucide-react';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await leaderboardService.getLeaderboard();
        setLeaderboard(res.data.leaderboard);
        setUserRank(res.data.currentUserRank);
      } catch (err) {
        console.error('Failed to fetch leaderboard rankings:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-amber-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="font-mono font-bold text-slate-400">#{rank}</span>;
  };

  if (loading) {
    return <LoadingSpinner fullPage label="Loading Student Leaderboard..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm mb-1">
            <Trophy className="w-4 h-4" />
            <span>DevOps Champions</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Student Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time student rankings based on completed labs and earned points.</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-6 shadow-2xl">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <Award className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-sm">No leaderboard entries available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-800 bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Completed Labs</th>
                  <th className="px-6 py-4 text-right">Total Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leaderboard.map((item) => (
                  <tr
                    key={item.user_id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      item.rank === 1 ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getRankBadge(item.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={item.name}
                          className="w-10 h-10 rounded-full ring-2 ring-slate-700 object-cover"
                        />
                        <div>
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-xs text-slate-400">{item.bio || 'DevOps Student'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      <div className="flex items-center space-x-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{item.tasks_completed} Labs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold">
                        <Award className="w-4 h-4" />
                        <span>{item.total_points} PTS</span>
                      </span>
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

export default LeaderboardPage;
