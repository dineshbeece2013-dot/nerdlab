import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';

// Public pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

// Authenticated pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TasksListPage = lazy(() => import('./pages/TasksListPage'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetailPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminTaskUpload = lazy(() => import('./pages/admin/AdminTaskUpload'));
const AdminManageTasks = lazy(() => import('./pages/admin/AdminManageTasks'));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'));
const AdminActivityLogs = lazy(() => import('./pages/admin/AdminActivityLogs'));
const AdminEmailSettings = lazy(() => import('./pages/admin/AdminEmailSettings'));

const PageLoader = () => (
  <LoadingSpinner fullPage label="Loading page..." />
);

// React Router keeps the previous scroll offset across navigations, so opening a
// task from halfway down the catalog would drop you into the middle of the lab.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Stop the browser restoring an old offset on reload/back as well.
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
            />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
            />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected student routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:id"
              element={
                <ProtectedRoute>
                  <TaskDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <LeaderboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <CertificatesPage />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminManageTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/tasks/upload"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminTaskUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminActivityLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings/email"
              element={
                <ProtectedRoute requireAdminRole>
                  <AdminEmailSettings />
                </ProtectedRoute>
              }
            />

            {/* Catch-all: redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
