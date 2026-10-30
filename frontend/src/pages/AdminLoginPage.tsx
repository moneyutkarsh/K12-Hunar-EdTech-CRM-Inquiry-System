import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate, Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  X,
  Mail,
  Send,
  KeyRound,
  RotateCw,
} from 'lucide-react';

const authFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type AuthFormData = z.infer<typeof authFormSchema>;

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  React.useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup') setMode('signup');
    else if (m === 'login') setMode('login');
  }, [searchParams]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ssoModal, setSsoModal] = useState<null | 'google' | 'email'>(null);
  const [ssoStep, setSsoStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState<string>('');
  const [resendCountdown, setResendCountdown] = useState<number>(0);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isSsoLoading, setIsSsoLoading] = useState<boolean>(false);
  const [customSsoEmail, setCustomSsoEmail] = useState<string>('');

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '67154574226-7m4jepbit7ln3r67c9um7e5teuhsao2p.apps.googleusercontent.com';

  // Initialize official Google Identity Services
  React.useEffect(() => {
    const initGoogleIdentity = () => {
      const g = (window as any).google;
      if (g?.accounts?.id) {
        try {
          g.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response?.credential) {
                setIsLoading(true);
                try {
                  const res = await api.post('/auth/oauth/google', {
                    credential: response.credential,
                  });
                  const payload = res.data.data || res.data;
                  login(payload.token, payload.admin);
                  toast.success(
                    `Signed in with Google as ${payload.admin.name || payload.admin.email}`
                  );
                  navigate('/admin', { replace: true });
                } catch (err: any) {
                  toast.error(err.response?.data?.error?.message || 'Google authentication failed');
                } finally {
                  setIsLoading(false);
                }
              }
            },
          });
        } catch {
          // ignore
        }
      }
    };

    initGoogleIdentity();
    const timer = setTimeout(initGoogleIdentity, 1200);
    return () => clearTimeout(timer);
  }, [googleClientId, login, navigate]);

  const triggerGoogleLogin = () => {
    const g = (window as any).google;
    if (g?.accounts?.id) {
      try {
        g.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setSsoModal('google');
          }
        });
        return;
      } catch {
        setSsoModal('google');
      }
    } else {
      setSsoModal('google');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  // Resend countdown timer for verification code
  React.useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  

  const handleSendOtp = async (targetEmail?: string) => {
    const emailToSend = (targetEmail || customSsoEmail).toLowerCase().trim();
    if (!emailToSend || !emailToSend.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setIsSsoLoading(true);
    try {
      const res = await api.post('/auth/otp/send', {
        email: emailToSend,
        provider: ssoModal || 'email',
      });
      const data = res.data;
      toast.success(`Verification code dispatched to ${emailToSend}`);
      if (data.previewCode) {
        setPreviewCode(data.previewCode);
      }
      setCustomSsoEmail(emailToSend);
      setSsoStep('code');
      setResendCountdown(60);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to send verification code. Please check your email and retry.';
      toast.error(msg);
    } finally {
      setIsSsoLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = otpCode.trim();
    if (cleanCode.length < 6) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }
    setIsSsoLoading(true);
    try {
      const res = await api.post('/auth/otp/verify', {
        email: customSsoEmail.toLowerCase().trim(),
        code: cleanCode,
      });
      const payload = res.data.data || res.data;
      const { token, admin } = payload;
      if (!token) throw new Error('Authentication token not received.');
      login(token, admin);
      toast.success(`Verification confirmed! Access granted as ${admin.name || admin.email}`);
      setSsoModal(null);
      setSsoStep('email');
      setOtpCode('');
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Invalid or expired verification code. Please request a new code.';
      toast.error(msg);
    } finally {
      setIsSsoLoading(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    const endpoint = mode === 'signup' ? '/auth/signup' : '/auth/login';

    try {
      const res = await api.post(endpoint, {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      const payload = res.data.data || res.data;
      const { token, admin } = payload;

      if (!token) {
        throw new Error('Authentication token not received.');
      }

      login(token, admin);
      toast.success(
        mode === 'signup'
          ? `Account created! Welcome, ${admin.email}`
          : `Welcome back, ${admin.email}`
      );
      navigate('/admin', { replace: true });
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error?.message ||
        (mode === 'signup' ? 'Failed to create account.' : 'Invalid email or password');
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-indigo-500/[0.07] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-[#FFD60A]/[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl relative z-10">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#A3A3A3] hover:text-[#FFD60A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to K12 Hunar Home</span>
          </Link>
        </div>

        {/* 2-Column Split Template Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch rounded-3xl bg-[#09090D]/88 backdrop-blur-2xl border border-white/10 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black/80 relative overflow-hidden">
          {/* Subtle top-edge shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

          {/* LEFT COLUMN: Sign In / Sign Up Form */}
          <div className="flex flex-col justify-center">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F5] tracking-tight">
                {mode === 'signup' ? 'Create Admin account' : 'Welcome to K12 Hunar'}
              </h1>
              <p className="text-xs sm:text-sm text-[#9CA3AF] mt-2">
                {mode === 'signup'
                  ? 'Start your experience with K12 Hunar by signing up or signing in.'
                  : 'Start your experience with K12 Hunar by signing in or signing up.'}
              </p>
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-[#C8C8D0] mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-xl bg-[#121217] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#555562] focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A] transition-all"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-[#F87171]">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-[#C8C8D0] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-[#121217] border border-white/10 text-sm text-[#F5F5F5] placeholder-[#555562] focus:outline-none focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#F5F5F5] transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-[#F87171]">{errors.password.message}</p>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:scale-[0.99] text-[#0A0A0A] font-bold text-sm shadow-md shadow-[#FFD60A]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{mode === 'signup' ? 'Signing up...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? 'Sign up' : 'Sign in'}</span>
                )}
              </button>
            </form>

            {/* Social Authentication Buttons */}
            <div className="space-y-3 mt-6">
              <button
                type="button"
                onClick={triggerGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-[#121217] hover:bg-white/[0.06] active:bg-white/[0.03] border border-white/10 text-xs font-medium text-[#F5F5F5] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm group"
              >
                <svg className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>


            </div>

            {/* Mode Switch & Privacy Policy */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-xs text-[#A3A3A3]">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                  className="text-[#FFD60A] font-semibold hover:underline cursor-pointer ml-1"
                >
                  {mode === 'signup' ? 'Sign in' : 'Sign up'}
                </button>
              </p>

              <p className="text-[11px] text-[#71717A]">
                By creating an account, you agree to our{' '}
                <a href="#" className="underline hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </p>

              {/* 1-click test credentials autofill */}
              <div className="pt-3 border-t border-white/5 text-[11px] text-[#71717A] flex items-center justify-center gap-2">
                <span>Quick demo fill:</span>
                <button
                  type="button"
                  onClick={() => autofillDemo('admin@k12hunar.com', 'Admin@12345')}
                  className="font-mono text-[#FFD60A]/90 hover:text-[#FFD60A] underline cursor-pointer"
                >
                  admin@k12hunar.com / Admin@12345
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: K12 Hunar Overview & Mission (Editorial human design) */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden shadow-xl min-h-[500px]">
            {/* Subtle natural warmth glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#FFD60A]/[0.03] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full space-y-8">
              {/* Top Section: Brand & Narrative */}
              <div className="space-y-6">
                {/* Brand Header */}
                <div className="flex items-center gap-3.5 pb-6 border-b border-white/10">
                  <img
                    src="/k12_hunar_logo.png"
                    alt="K12 Hunar"
                    className="w-12 h-12 rounded-xl object-contain bg-black/40 border border-white/10 p-1 shadow-md"
                  />
                  <div>
                    <h2 className="font-bold text-lg text-white tracking-tight">K12 Hunar</h2>
                    <p className="text-xs text-[#9CA3AF]">Education Consulting & Technology</p>
                  </div>
                </div>

                {/* Narrative Paragraph 1 */}
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-medium text-[#F5F5F5] leading-relaxed">
                    K12 Hunar is a K–12 education consulting and technology venture working across the education ecosystem.
                  </p>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    We help institutions move from ideas and priorities to practical programs, stronger capabilities, effective technology adoption, and measurable outcomes.
                  </p>
                </div>

                {/* Narrative Paragraph 2 */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <p className="text-sm font-semibold text-[#F5F5F5] tracking-tight">
                    K12 Hunar Clubs & Student Initiatives
                  </p>
                  <p className="text-sm text-[#A1A1AA] leading-relaxed">
                    Through K12 Hunar Clubs and other student-focused initiatives, we also connect students with practical skills, projects, mentorship, leadership experiences, and verified opportunities beyond the classroom.
                  </p>
                </div>

                {/* Editorial Pillars (natural, uncluttered inline list with amber bullets) */}
                <div className="pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#D4D4D8]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shrink-0" />
                      <span>Practical Skills & Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shrink-0" />
                      <span>Mentorship & Guidance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shrink-0" />
                      <span>Leadership Experiences</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] shrink-0" />
                      <span>Verified Opportunities</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiet, authentic footer */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#71717A]">
                <span>Partner Institutions & Educators</span>
                <span className="text-[#A1A1AA] font-mono text-[11px]">k12hunar.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Email Verification / SSO Modal */}
        {ssoModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-w-md w-full rounded-2xl bg-[#111111] border border-white/15 p-6 shadow-2xl relative space-y-5 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  {ssoModal === 'google' ? (
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </div>

                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 flex items-center justify-center text-[#FFD60A]">
                      <Mail className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-bold text-[#F5F5F5]">
                      {ssoModal === 'google'
                        ? 'Google Workspace Verification'
                        : 'Email Verification Code'}
                    </h2>
                    <p className="text-[11px] text-[#A3A3A3]">
                      {ssoStep === 'email'
                        ? 'Enter your email to receive a secure 6-digit code'
                        : 'Enter the 6-digit code sent to your email'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSsoModal(null);
                    setSsoStep('email');
                    setOtpCode('');
                  }}
                  disabled={isSsoLoading}
                  className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Input Email & Request Code */}
              {ssoStep === 'email' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customSsoEmail.trim()) {
                      handleSendOtp();
                    }
                  }}
                  className="space-y-4 pt-1"
                >
                  <div>
                    <label htmlFor="custom-sso" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                      {ssoModal === 'google'
                        ? 'Google / Workspace Email'
                        : 'Administrator Email'}
                    </label>
                    <input
                      id="custom-sso"
                      type="email"
                      autoFocus
                      placeholder={
                        ssoModal === 'google'
                          ? 'admin@school.edu'
                          : 'admin@k12hunar.com'
                      }
                      value={customSsoEmail}
                      onChange={(e) => setCustomSsoEmail(e.target.value)}
                      disabled={isSsoLoading}
                      className="w-full px-3.5 py-2.5 dark-input text-sm rounded-xl"
                      required
                    />
                    <p className="text-[11px] text-[#A3A3A3] mt-1.5">
                      A single-use 6-digit verification code will be sent to this email address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSsoLoading || !customSsoEmail.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isSsoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending verification code...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Verification Code</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Step 2: Input 6-Digit Code & Verify */
                <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="truncate">
                      <span className="text-[#A3A3A3]">Code sent to: </span>
                      <strong className="text-[#F5F5F5] font-mono">{customSsoEmail}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSsoStep('email')}
                      className="text-[#FFD60A] hover:underline font-semibold ml-2 shrink-0 cursor-pointer text-xs"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label htmlFor="otp-code" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5 text-center">
                      6-Digit Verification Code
                    </label>
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      placeholder="••••••"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isSsoLoading}
                      className="w-full py-3 px-4 rounded-xl bg-black/60 border border-[#FFD60A]/40 text-[#FFD60A] font-mono text-2xl font-bold tracking-[0.45em] text-center focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/60 shadow-inner"
                      required
                    />
                  </div>

                  {previewCode && (
                    <div className="bg-[#FFD60A]/10 border border-[#FFD60A]/30 rounded-xl p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-[#FFD60A]">
                        <KeyRound className="w-4 h-4 shrink-0" />
                        <span>Code: <strong className="font-mono tracking-widest">{previewCode}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOtpCode(previewCode)}
                        className="px-2.5 py-1 rounded-lg bg-[#FFD60A] text-[#0A0A0A] font-bold text-[11px] hover:bg-[#FFE14D] transition-colors cursor-pointer"
                      >
                        Autofill
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-[#A3A3A3]">Didn't receive the email?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-[#A3A3A3] font-mono text-xs">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSsoLoading}
                        className="text-[#FFD60A] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSsoLoading || otpCode.trim().length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-xs disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    {isSsoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying code...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Security info note */}
              <p className="text-[10px] text-white/40 text-center leading-relaxed">
                Code expires in 10 minutes. Protected by 256-bit JWT session encryption.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;
