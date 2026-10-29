import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, LayoutDashboard, Menu, X, Bell, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const { isAuthenticated, admin, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // U6b Shell state
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const isDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  // Check health and measure latency
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await api.get('/health');
      const diff = Math.round(performance.now() - start);
      setLatencyMs(diff);
      if (res.data?.status === 'ok' || res.data?.db === 'up') {
        setHealthStatus('healthy');
      } else {
        setHealthStatus('degraded');
      }
    } catch {
      setHealthStatus('offline');
      setLatencyMs(null);
    }
  }, []);

  // Fetch recent inquiries for notification dropdown
  const fetchRecent = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/inquiries', {
        params: { limit: 5, sort: 'createdAt', order: 'desc' },
      });
      const items = res.data?.data || res.data;
      if (Array.isArray(items)) {
        setRecentInquiries(items);
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Polling every 30s
  useEffect(() => {
    if (isAuthenticated && isDashboard) {
      checkHealth();
      fetchRecent();
      const interval = setInterval(() => {
        checkHealth();
        fetchRecent();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isDashboard, checkHealth, fetchRecent]);

  // Seconds counter for "Updated Xs ago"
  useEffect(() => {
    const secTimer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(secTimer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setSecondsAgo(0);
    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
    checkHealth();
    fetchRecent();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <nav className="w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors">
            K12 Hunar <span className="text-[#FFD60A] font-light text-sm ml-1 px-1.5 py-0.5 rounded bg-[#FFD60A]/10 border border-[#FFD60A]/20">CRM</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/"
            className={`text-sm px-3.5 py-1.5 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'text-[#FFD60A] bg-white/5 font-medium'
                : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
            }`}
          >
            Submit Inquiry
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-lg border transition-all ${
                  isDashboard
                    ? 'bg-[#0A0A0A] text-[#FFD60A] border-[#FFD60A]/40 shadow-sm'
                    : 'text-[#A3A3A3] border-white/10 hover:text-[#F5F5F5]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-[#FFD60A]" />
                <span>Dashboard</span>
              </Link>

              {/* Header additions left of admin email (U6b) */}
              {isDashboard && (
                <div className="flex items-center gap-2 pr-1 border-r border-white/10">
                  {/* API Health Status Dot */}
                  <div
                    className="relative flex items-center justify-center p-1.5 cursor-help"
                    title={`API Status: ${healthStatus.toUpperCase()} · Latency: ${latencyMs !== null ? `${latencyMs}ms` : 'checking...'}`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        healthStatus === 'healthy'
                          ? 'bg-[#4ADE80] ring-4 ring-[#4ADE80]/20'
                          : healthStatus === 'degraded'
                          ? 'bg-[#FB923C] ring-4 ring-[#FB923C]/20'
                          : 'bg-[#F87171] ring-4 ring-[#F87171]/20'
                      }`}
                    />
                  </div>

                  {/* Refresh Button with Updated Xs ago */}
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    title="Refresh inquiries data"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors border border-white/5"
                  >
                    <RotateCcw className={`w-3 h-3 text-[#FFD60A] ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden xl:inline">{secondsAgo < 5 ? 'Updated just now' : `Updated ${secondsAgo}s ago`}</span>
                  </button>

                  {/* Notification Bell with unread badge */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen((prev) => !prev)}
                      title="New inquiries"
                      aria-label="View recent inquiries"
                      className="p-1.5 rounded-lg hover:bg-white/5 text-[#A3A3A3] hover:text-[#FFD60A] transition-colors relative"
                    >
                      <Bell className="w-4 h-4" />
                      {recentInquiries.length > 0 && (
                        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FFD60A] ring-2 ring-[#050505]" />
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationsOpen && (
                      <div className="absolute right-0 top-9 w-72 rounded-xl bg-[#141414] border border-white/15 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 text-xs">
                          <span className="font-bold text-[#F5F5F5]">Recent Inquiries</span>
                          <span className="text-[10px] text-[#FFD60A] font-semibold">{recentInquiries.length} recent</span>
                        </div>
                        <div className="py-1 divide-y divide-white/5 max-h-64 overflow-y-auto">
                          {recentInquiries.length === 0 ? (
                            <div className="p-3 text-center text-xs text-[#A3A3A3]">No new inquiries</div>
                          ) : (
                            recentInquiries.map((inq) => (
                              <button
                                key={inq.id}
                                onClick={() => {
                                  setIsNotificationsOpen(false);
                                  window.dispatchEvent(new CustomEvent('open-inquiry', { detail: inq }));
                                }}
                                className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors flex items-start justify-between gap-2 text-xs group"
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-[#F5F5F5] group-hover:text-[#FFD60A] truncate">
                                    {inq.name}
                                  </p>
                                  <p className="text-[10px] text-[#A3A3A3] truncate">{inq.category}</p>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#A3A3A3] shrink-0">
                                  {inq.status}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                <div className="text-right">
                  <p className="text-xs font-medium text-[#F5F5F5] leading-tight">{admin?.email}</p>
                  <p className="text-[10px] text-[#FFD60A]">Admin</p>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="p-1.5 rounded-lg hover:bg-white/5 text-[#A3A3A3] hover:text-[#F87171] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <Link
              to="/admin/login"
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F5F5] hover:text-[#FFD60A] transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-[#FFD60A]" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0F0F0F] px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm text-[#F5F5F5] hover:bg-white/5"
          >
            Submit Inquiry
          </Link>
          {isAuthenticated ? (
            <>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#FFD60A] bg-white/5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard ({admin?.email})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm text-[#F87171] hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F5F5F5] hover:bg-white/5"
            >
              <Shield className="w-4 h-4 text-[#FFD60A]" />
              Admin Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
