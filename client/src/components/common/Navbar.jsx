import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Terminal,
  LogOut,
  User,
  LayoutDashboard,
  Award,
  ShieldAlert,
  ShieldCheck,
  Menu,
  X,
  Code2,
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg text-white tracking-wide">NerdLab</span>
              <span className="text-xs block text-sky-400 font-medium tracking-wider">LEARNING PLATFORM</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive('/dashboard') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/tasks"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive('/tasks') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>DevOps Tasks</span>
                </Link>
                <Link
                  to="/leaderboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive('/leaderboard') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  to="/certificates"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isActive('/certificates') ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Certificates</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      isActive('/admin') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin Suite</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                to="/tasks"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                Browse Labs
              </Link>
            )}
          </div>

          {/* Right Action Icons & User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l border-slate-800 pl-3">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
                >
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full ring-2 ring-sky-500/50 object-cover"
                  />
                  <div className="text-left">
                    <span className="text-sm font-medium text-white block leading-tight">{user?.name}</span>
                    <span className="text-[10px] text-sky-400 uppercase tracking-wider block font-semibold">{user?.role}</span>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 rounded-xl shadow-lg shadow-sky-500/25 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Dashboard
              </Link>
              <Link
                to="/tasks"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                DevOps Tasks
              </Link>
              <Link
                to="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Leaderboard
              </Link>
              <Link
                to="/certificates"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Certificates
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
              >
                Profile Settings
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-amber-500/10"
                >
                  Admin Suite
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 rounded-xl text-slate-200 border border-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 rounded-xl text-white bg-sky-500 font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
