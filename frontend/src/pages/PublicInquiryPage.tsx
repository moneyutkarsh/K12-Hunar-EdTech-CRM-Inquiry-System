import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Sparkles, Send, CheckCircle2, Loader2, Shield, GraduationCap, Award, Building2 } from 'lucide-react';

const publicInquirySchema = z.object({
  userType: z.enum(['Parent', 'Student', 'School'], {
    message: 'Please select whether you are a Parent, Student, or School',
  }),
  category: z.enum(['Scholarship', 'Concert', 'Admission', 'General Query'], {
    message: 'Please select an inquiry category',
  }),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z
    .string()
    .refine((val) => {
      const digits = val.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15;
    }, 'Phone number must have between 7 and 15 digits'),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must not exceed 1000 characters'),
  honeypot: z.string().optional(),
});

type FormData = z.infer<typeof publicInquirySchema>;

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'US / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

export const PublicInquiryPage: React.FC = () => {
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countryCode, setCountryCode] = useState<string>('+91');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(publicInquirySchema),
    defaultValues: {
      userType: 'Parent',
      category: 'Admission',
      name: '',
      email: '',
      phone: '',
      message: '',
      honeypot: '',
    },
  });

  const messageVal = watch('message') || '';

  const onSubmit = async (data: FormData) => {
    // If bot filled the honeypot, silently abort
    if (data.honeypot && data.honeypot.length > 0) {
      console.warn('Bot submission blocked via honeypot');
      return;
    }

    const trimmedPhone = data.phone.trim();
    let formattedPhone = trimmedPhone;
    if (!trimmedPhone.startsWith('+')) {
      formattedPhone = `${countryCode} ${trimmedPhone}`;
    }

    const { honeypot, ...cleanData } = data;

    setIsSubmitting(true);
    try {
      await api.post('/inquiries', {
        ...cleanData,
        phone: formattedPhone,
        ...(honeypot ? { website: honeypot } : {}),
      });
      setIsSuccess(true);
      toast.success("Thank you! Your inquiry was submitted successfully.");
    } catch (err: any) {
      const errMsg = err.response?.data?.error?.message || 'Failed to submit inquiry. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    reset();
    setIsSuccess(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl glass-card overflow-hidden shadow-2xl border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Hero Brand Card */}
          <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-[#0F0F0F] to-[#141414] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD60A]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD60A]/10 border border-[#FFD60A]/30 text-[#FFD60A] text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen K12 Education</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight leading-tight mb-4">
                Send an <span className="text-[#FFD60A]">inquiry</span>
              </h1>

              <p className="text-sm text-[#A3A3A3] leading-relaxed mb-8">
                Connect with the Hunar admissions, scholarships, and school partnership teams. We are committed to nurturing real talent across the country.
              </p>

              {/* Value highlights */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-[#FFD60A] border border-white/10 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-[#F5F5F5]">Merit & Need Scholarships</h2>
                    <p className="text-[11px] text-[#A3A3A3]">Empowering deserving learners with holistic financial support.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-[#FFD60A] border border-white/10 shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-[#F5F5F5]">Interactive Curriculum</h2>
                    <p className="text-[11px] text-[#A3A3A3]">Project-based cohorts designed with leading industry mentors.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/5 text-[#FFD60A] border border-white/10 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-semibold text-[#F5F5F5]">School Partnerships</h2>
                    <p className="text-[11px] text-[#A3A3A3]">Annual inter-school concerts, hackathons, and symposiums.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Admin portal link */}
            <div className="pt-8 border-t border-white/10 relative z-10 flex items-center justify-between">
              <span className="text-[11px] text-[#A3A3A3]">Staff member?</span>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#FFD60A] hover:underline font-medium"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </Link>
            </div>
          </div>

          {/* Right Panel: Interactive Form / Success State */}
          <div className="lg:col-span-7 p-8 sm:p-10 bg-[#0F0F0F]/80">
            {isSuccess ? (
              // Animated Success State
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80] mb-5 shadow-lg shadow-[#4ADE80]/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-2">Thanks, we'll get back to you soon!</h3>
                <p className="text-sm text-[#A3A3A3] max-w-md mb-8">
                  Your inquiry has been logged in our system. A counselor or coordinator will review your message and reach out via phone or email shortly.
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-sm shadow-md transition-all active:scale-95"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              // Form
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Bot Honeypot Field (invisible to genuine users) */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  {...register('honeypot')}
                />

                {/* Grid for User Type & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User Type */}
                  <div>
                    <label htmlFor="userType" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                      I am a <span className="text-[#FFD60A]">*</span>
                    </label>
                    <select
                      id="userType"
                      {...register('userType')}
                      className="w-full px-3.5 py-2.5 dark-input text-sm cursor-pointer"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Student">Student</option>
                      <option value="School">School / Institution</option>
                    </select>
                    {errors.userType && (
                      <p className="mt-1 text-xs text-[#F87171]">{errors.userType.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                      Inquiry Category <span className="text-[#FFD60A]">*</span>
                    </label>
                    <select
                      id="category"
                      {...register('category')}
                      className="w-full px-3.5 py-2.5 dark-input text-sm cursor-pointer"
                    >
                      <option value="Admission">Admission</option>
                      <option value="Scholarship">Scholarship</option>
                      <option value="Concert">Concert</option>
                      <option value="General Query">General Query</option>
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-xs text-[#F87171]">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                    Full Name <span className="text-[#FFD60A]">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Aarav Sharma"
                    {...register('name')}
                    className="w-full px-3.5 py-2.5 dark-input text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-[#F87171]">{errors.name.message}</p>
                  )}
                </div>

                {/* Email and Phone Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                      Email Address <span className="text-[#FFD60A]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      {...register('email')}
                      className="w-full px-3.5 py-2.5 dark-input text-sm"
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-[#F87171]">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone with Country Option */}
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                      Phone Number <span className="text-[#FFD60A]">*</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        aria-label="Country Code"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="px-2.5 py-2.5 dark-input text-xs sm:text-sm cursor-pointer w-28 shrink-0 rounded-xl"
                      >
                        {COUNTRY_CODES.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.flag} {item.code}
                          </option>
                        ))}
                      </select>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="63943 98355"
                        {...register('phone')}
                        className="w-full px-3.5 py-2.5 dark-input text-sm rounded-xl"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-[#F87171]">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="message" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                      Your Message <span className="text-[#FFD60A]">*</span>
                    </label>
                    <span className="text-[11px] text-[#A3A3A3]">
                      {messageVal.length}/1000 characters
                    </span>
                  </div>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Please tell us about your query, student grade, or program requirements..."
                    {...register('message')}
                    className="w-full px-3.5 py-2.5 dark-input text-sm resize-none"
                  />
                  {errors.message && (
                    <p className="mt-1 text-xs text-[#F87171]">{errors.message.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:bg-[#E6BF00] text-[#0A0A0A] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting inquiry...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Inquiry</span>
                      <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicInquiryPage;
