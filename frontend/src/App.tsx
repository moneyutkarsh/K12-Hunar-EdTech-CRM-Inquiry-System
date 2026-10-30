import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import GridScanBackground from './components/layout/GridScanBackground';
import AppBackground from './components/AppBackground';
import Navbar from './components/Navbar';
import ServerWakeBanner from './components/ServerWakeBanner';
import HomePage from './pages/HomePage';
import PublicInquiryPage from './pages/PublicInquiryPage';
import PublicTrackerPage from './pages/PublicTrackerPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminActivityPage from './pages/AdminActivityPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import { Loader2 } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-[#FFD60A] animate-spin" />
          <span className="text-xs text-[#A3A3A3]">Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

// Main App Layout Wrapper with Background & Toast
const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAuth = location.pathname === '/admin/login';
  const isDashboard = location.pathname.startsWith('/admin') && !isAuth;

  return (
    <div className="relative min-h-screen text-[#F5F5F5] flex flex-col font-sans selection:bg-[#FFD60A] selection:text-[#0A0A0A] bg-[#050505]">
      {/* Background layer: GridScan on /admin dashboard; React Bits AeroShards on every other page */}
      {isDashboard ? (
        <GridScanBackground />
      ) : (
        <AppBackground isDashboard={false} />
      )}

      {/* Render Server Wakeup Banner */}
      <ServerWakeBanner />

      {/* Top Navbar: rendered on non-home pages (Home page renders its own rich header with anchor links) */}
      {!isHome && <Navbar />}

      {/* Route Views */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/inquiry" element={<PublicInquiryPage />} />
          <Route path="/track" element={<PublicTrackerPage />} />
          <Route path="/submit" element={<Navigate to="/inquiry" replace />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/activity"
            element={
              <ProtectedRoute>
                <AdminActivityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Notification Toast Layer */}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#141414',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F5F5F5',
            borderRadius: '0.75rem',
          },
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
