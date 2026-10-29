import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings,
  ArrowLeft,
  User,
  Shield,
  Sliders,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Monitor,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type TabType = 'profile' | 'security' | 'preferences';

export const AdminSettingsPage: React.FC = () => {
  const { admin, login, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileData, setProfileData] = useState<any>(admin);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Revoke modal state
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);

  // Copied email state
  const [hasCopiedEmail, setHasCopiedEmail] = useState(false);

  // Preferences State
  const [gridScanEnabled, setGridScanEnabled] = useState(() => {
    return localStorage.getItem('k12_gridscan_enabled') !== 'false';
  });
  const [audioFeedback, setAudioFeedback] = useState(() => {
    return localStorage.getItem('k12_audio_feedback') === 'true';
  });
  const [compactDensity, setCompactDensity] = useState(() => {
    return localStorage.getItem('k12_compact_density') === 'true';
  });

  // Password criteria check
  const criteria = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    matches: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const isPasswordValid =
    criteria.length &&
    criteria.uppercase &&
    criteria.lowercase &&
    criteria.number &&
    criteria.special &&
    criteria.matches;

  // Refresh profile from backend
  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      const data = res.data?.data?.admin || res.data?.admin;
      if (data) {
        setProfileData(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setHasCopiedEmail(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setHasCopiedEmail(false), 2000);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      toast.error('Please ensure all password requirements are satisfied');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      const res = await api.patch('/auth/password', {
        currentPassword,
        newPassword,
      });

      const { token, tokenVersion } = res.data;
      if (token && profileData) {
        // Update current auth session with new JWT and incremented token version
        login(token, { ...profileData, tokenVersion });
        setProfileData((prev: any) => ({ ...prev, tokenVersion }));
      }

      toast.success('Password updated successfully! Other sessions have been revoked.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update password. Check your current password.';
      toast.error(msg);
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setIsRevokingSessions(true);
      await api.post('/auth/logout-all');
      toast.success('All active sessions invalidated. Please sign in again.');
      logout();
      navigate('/admin/login');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to revoke sessions.';
      toast.error(msg);
      setIsRevokingSessions(false);
    }
  };

  const toggleGridScan = () => {
    const nextVal = !gridScanEnabled;
    setGridScanEnabled(nextVal);
    localStorage.setItem('k12_gridscan_enabled', String(nextVal));
    toast.success(`Grid Scan background ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const toggleAudio = () => {
    const nextVal = !audioFeedback;
    setAudioFeedback(nextVal);
    localStorage.setItem('k12_audio_feedback', String(nextVal));
    toast.success(`Sound feedback ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const toggleCompactDensity = () => {
    const nextVal = !compactDensity;
    setCompactDensity(nextVal);
    localStorage.setItem('k12_compact_density', String(nextVal));
    toast.success(`Compact table density ${nextVal ? 'enabled' : 'disabled'}`);
  };

  const currentAdmin = profileData || admin;
  const displayName = currentAdmin?.name || currentAdmin?.email?.split('@')[0] || 'Admin';
  const roleName = currentAdmin?.role === 'superadmin' ? 'Superadmin' : 'Lead Admin';
  const sessionVersion = currentAdmin?.tokenVersion || 1;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] transition-colors border border-white/5"
            title="Back to Inquiries Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center shadow-lg shadow-[#FFD60A]/5">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] font-display">System & Security Settings</h1>
              <p className="text-xs text-[#A3A3A3]">Manage credentials, session token revocation, and interface preferences</p>
            </div>
          </div>
        </div>

        {/* Quick Session Version Chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#A3A3A3] self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Session Security:</span>
          <span className="font-mono text-[#FFD60A] font-semibold">v{sessionVersion}</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#FFD60A] text-[#FFD60A]'
              : 'border-transparent text-[#A3A3A3] hover:text-[#F5F5F5]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Role</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-[#FFD60A] text-[#FFD60A]'
              : 'border-transparent text-[#A3A3A3] hover:text-[#F5F5F5]'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Sessions</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'preferences'
              ? 'border-[#FFD60A] text-[#FFD60A]'
              : 'border-transparent text-[#A3A3A3] hover:text-[#F5F5F5]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>UI Preferences</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FFD60A]/20 to-[#FFD60A]/5 border border-[#FFD60A]/30 text-[#FFD60A] flex items-center justify-center font-display text-2xl font-bold shadow-inner">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#F5F5F5]">{displayName}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30">
                    {roleName}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
                  <span>{currentAdmin?.email}</span>
                  <button
                    onClick={() => currentAdmin?.email && handleCopyEmail(currentAdmin.email)}
                    className="p-1 rounded hover:bg-white/10 text-[#A3A3A3] hover:text-[#FFD60A] transition-colors"
                    title="Copy Email"
                  >
                    {hasCopiedEmail ? <Check className="w-3.5 h-3.5 text-[#22C55E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[11px] text-[#A3A3A3] uppercase font-semibold">Admin Identifier</span>
                <p className="text-xs font-mono text-[#F5F5F5] truncate" title={currentAdmin?.id}>
                  {currentAdmin?.id || '—'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[11px] text-[#A3A3A3] uppercase font-semibold">Account Status</span>
                <div className="flex items-center gap-1.5 text-xs text-[#22C55E] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>Active & Verified</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[11px] text-[#A3A3A3] uppercase font-semibold">Token Security Version</span>
                <p className="text-xs font-mono text-[#FFD60A] font-semibold">v{sessionVersion} (Active)</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 bg-[#FFD60A]/[0.02] border-[#FFD60A]/15 text-xs text-[#A3A3A3] flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-[#FFD60A] shrink-0 mt-0.5" />
            <p>
              To modify permissions, add department staff, or reassign lead triage queues, request changes from your
              superadmin or organization administrator.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Session Revocation */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <KeyRound className="w-5 h-5 text-[#FFD60A]" />
              <div>
                <h2 className="text-base font-bold text-[#F5F5F5]">Update Security Password</h2>
                <p className="text-xs text-[#A3A3A3]">
                  Requires your current credentials. Updating your password automatically revokes all other active sessions.
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-[#F5F5F5] mb-1.5">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-medium text-[#F5F5F5] mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 characters, uppercase, lowercase, number, symbol"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A] transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-[#F5F5F5] mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0A] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#525252] focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A] transition-all"
                />
              </div>

              {/* Password Complexity Checklist */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs">
                <span className="font-semibold text-[#A3A3A3] text-[11px] uppercase tracking-wider block">
                  Password Requirements:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className={`flex items-center gap-2 ${criteria.length ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.length ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-2 ${criteria.uppercase ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.uppercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>1 uppercase letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${criteria.lowercase ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.lowercase ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>1 lowercase letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${criteria.number ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.number ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>1 number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${criteria.special ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.special ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>1 special symbol (!@#$...)</span>
                  </div>
                  <div className={`flex items-center gap-2 ${criteria.matches ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                    {criteria.matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isPasswordValid || isSubmittingPassword}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FFD60A] text-[#0A0A0A] font-semibold text-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#FFD60A]/10 flex items-center justify-center gap-2"
              >
                {isSubmittingPassword ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>

          {/* Active Sessions & Emergency Revocation Card */}
          <div className="glass-card p-6 sm:p-8 border-red-500/20 bg-red-500/[0.01]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Session Invalidation & Emergency Logout</span>
                </div>
                <p className="text-xs text-[#A3A3A3] max-w-xl">
                  Lost a device or suspect unauthorized access? Terminating all sessions increments your security version
                  to <span className="font-mono text-[#FFD60A]">v{sessionVersion + 1}</span>, instantly rejecting all
                  existing tokens everywhere.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowRevokeModal(true)}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Revoke All Active Sessions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: UI Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-white/10">
              <h2 className="text-base font-bold text-[#F5F5F5]">Interface & Visual Aesthetics</h2>
              <p className="text-xs text-[#A3A3A3]">Tailor dashboard background rendering, sound alerts, and density</p>
            </div>

            <div className="space-y-4">
              {/* GridScan Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">Grid Scan Background Effect</h3>
                    <p className="text-xs text-[#A3A3A3]">
                      Render dynamic GPU-accelerated scanline grid behind admin dashboard cards
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleGridScan}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    gridScanEnabled ? 'bg-[#FFD60A]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#0A0A0A] transition-transform ${
                      gridScanEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Feedback Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">Audio Confirmation</h3>
                    <p className="text-xs text-[#A3A3A3]">Play subtle acoustic feedback upon status and priority updates</p>
                  </div>
                </div>
                <button
                  onClick={toggleAudio}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    audioFeedback ? 'bg-[#FFD60A]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#0A0A0A] transition-transform ${
                      audioFeedback ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Table Density */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5F5F5]">Compact Table Density</h3>
                    <p className="text-xs text-[#A3A3A3]">
                      Condense table row padding to fit more inquiries per view
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleCompactDensity}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                    compactDensity ? 'bg-[#FFD60A]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-[#0A0A0A] transition-transform ${
                      compactDensity ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Session Revocation */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 space-y-4 border-red-500/30">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F5F5F5]">Revoke All Sessions?</h3>
                <p className="text-xs text-[#A3A3A3]">This action will immediately terminate all active logins</p>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Every active browser, tablet, or phone currently logged into this account will be invalidated immediately.
              You will be signed out and must re-enter your password to regain access.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                disabled={isRevokingSessions}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F5F5F5] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeAllSessions}
                disabled={isRevokingSessions}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20"
              >
                {isRevokingSessions ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Invalidating...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Confirm Revocation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
