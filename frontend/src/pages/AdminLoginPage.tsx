import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Shield, Eye, EyeOff, Loader2, ArrowLeft, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const AdminLoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: data.email.toLowerCase().trim(),
        password: data.password,
      });

      const { token, admin } = res.data;
      login(token, admin);
      toast.success(`Welcome back, ${admin.email}`);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      // Generic error message for security
      const errMsg = err.response?.data?.error?.message || 'Invalid email or password';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Back to public link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-[#FFD60A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Public Inquiry Form</span>
          </Link>
        </div>

        {/* Centered Glass Login Card */}
        <div className="glass-card p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Ambient yellow accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD60A]/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

          {/* Icon and Title */}
          <div className="text-center mb-8 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 flex items-center justify-center text-[#FFD60A] mx-auto mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#F5F5F5] tracking-tight">Admin Login</h1>
            <p className="text-xs text-[#A3A3A3] mt-1.5">
              Secure portal for managing inquiries and system statistics
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Admin Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@k12hunar.com"
                {...register('email')}
                className="w-full px-3.5 py-2.5 dark-input text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#F87171]">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="w-full px-3.5 py-2.5 pr-10 dark-input text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#F5F5F5] transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-[#F87171]">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:bg-[#E6BF00] text-[#0A0A0A] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign in to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Test credentials hint for reviewer */}
          <div className="mt-6 pt-5 border-t border-white/5 text-center text-[11px] text-[#A3A3A3]">
            <p className="text-white/60">Demo Credentials:</p>
            <p className="font-mono text-[#FFD60A] mt-0.5">admin@k12hunar.com / Admin@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
