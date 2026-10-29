import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  GraduationCap,
  Building2,
  Award,
  Music,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ShieldCheck,
  Send,
  Menu,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

interface PublicStats {
  handledApprox: number;
  resolvedPct: number;
  avgFirstResponseHours: number;
}

const FAQ_ITEMS = [
  {
    q: 'How quickly will someone respond to my inquiry?',
    a: 'Our admissions and counseling team reviews all inquiries during active office hours (IST). You will receive an initial response within 24 hours of submission, with urgent and scholarship queries often addressed within 10 to 12 hours.',
  },
  {
    q: 'How do I track the status of my inquiry?',
    a: 'When you submit an inquiry, you receive an 8-character reference code (e.g., KH-A8B9C2D3). You can enter this code along with your registered email address on our Track Inquiry page to view live status updates and response timelines.',
  },
  {
    q: 'Are scholarship inquiries free to submit?',
    a: 'Yes, 100% free. K12 Hunar offers both merit-based and need-based talent scholarships. There are zero application or inquiry fees for parents and students.',
  },
  {
    q: 'Can schools submit inquiries for entire batches of students?',
    a: 'Yes! School principals, coordinators, and teachers can select "School / Institution" as their user type to request institutional partnerships, concert participation packages, or campus workshops.',
  },
  {
    q: 'What information do I need to provide in the inquiry?',
    a: 'You simply need your name, valid email address, phone number, category of interest, and a brief description of what you are seeking. You do not need to upload certificates or documents during the initial inquiry.',
  },
  {
    q: 'Is my contact information secure and kept private?',
    a: 'Absolutely. K12 Hunar strictly adheres to data privacy standards. Your phone number and email are exclusively used by our counseling team to address your query and are never sold or shared with third-party advertisers.',
  },
];

export const HomePage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [stats, setStats] = useState<PublicStats>({
    handledApprox: 120,
    resolvedPct: 54,
    avgFirstResponseHours: 10.6,
  });
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch live aggregate stats from public endpoint
  useEffect(() => {
    let isMounted = true;
    api
      .get('/public/stats')
      .then((res) => {
        if (isMounted && res.data) {
          setStats({
            handledApprox: res.data.handledApprox ?? 120,
            resolvedPct: res.data.resolvedPct ?? 54,
            avgFirstResponseHours: res.data.avgFirstResponseHours ?? 10.6,
          });
        }
      })
      .catch(() => {
        // Keep resilient fallback defaults if offline or rate-limited
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // SEO & JSON-LD Injection
  useEffect(() => {
    document.title = 'K12 Hunar CRM & Inquiry Portal — Scholarships, Admissions & Concerts';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'faq-json-ld';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('faq-json-ld');
      if (existing) document.head.removeChild(existing);
    };
  }, []);

  const headlineWords = ['Scholarships,', 'admissions', 'and', 'concerts.'];
  const headlineAccent = 'One place to ask.';

  return (
    <div className="relative min-h-screen text-[#F5F5F5] font-sans selection:bg-[#FFD60A] selection:text-[#0A0A0A]">
      {/* Skip to Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#FFD60A] text-[#0A0A0A] font-bold rounded-lg shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* 1. Public Navbar (Sticky, Glass Blur) */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#050505]/80 border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand Pill */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              H
            </div>
            <span className="font-bold text-base tracking-tight text-[#F5F5F5]">
              K12 Hunar
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/30">
              Portal
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#A3A3A3]">
            <a href="#services" className="hover:text-[#F5F5F5] transition-colors">
              Programs & Services
            </a>
            <a href="#who" className="hover:text-[#F5F5F5] transition-colors">
              Who It's For
            </a>
            <a href="#how-it-works" className="hover:text-[#F5F5F5] transition-colors">
              How It Works
            </a>
            <a href="#faq" className="hover:text-[#F5F5F5] transition-colors">
              FAQ
            </a>
            <Link
              to="/track"
              className="flex items-center gap-1 hover:text-[#FFD60A] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track Inquiry</span>
            </Link>
          </nav>

          {/* CTA & Admin Link */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/admin/login"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors"
            >
              Admin Portal
            </Link>
            <Link
              to="/inquiry"
              className="px-4 py-2 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:bg-[#E6BF00] text-[#0A0A0A] text-xs font-bold shadow-md transition-all flex items-center gap-1.5 group cursor-pointer"
            >
              <span>Submit Inquiry</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-6 bg-[#0A0A0A]/95 border-b border-white/10 space-y-3">
            <a
              href="#services"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-[#A3A3A3] hover:text-[#FFD60A]"
            >
              Programs & Services
            </a>
            <a
              href="#who"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-[#A3A3A3] hover:text-[#FFD60A]"
            >
              Who It's For
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-[#A3A3A3] hover:text-[#FFD60A]"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-[#A3A3A3] hover:text-[#FFD60A]"
            >
              FAQ
            </a>
            <Link
              to="/track"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-sm text-[#FFD60A] font-semibold"
            >
              Track Existing Inquiry
            </Link>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/inquiry"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#FFD60A] text-[#0A0A0A] font-bold text-center text-sm shadow-sm"
              >
                Submit Inquiry
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2 rounded-lg text-center text-xs text-[#A3A3A3] hover:text-[#F5F5F5]"
              >
                Admin Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Page Landmark */}
      <main id="main-content">
        {/* 2. Hero Section */}
        <section
          id="home-hero-section"
          className="relative pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          <div className="max-w-3xl">
            {/* Eyebrow Chip */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFD60A]/10 border border-[#FFD60A]/30 text-[#FFD60A] text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EdTech inquiries, handled transparently</span>
            </div>

            {/* Word-by-Word Reveal Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#F5F5F5] tracking-tight leading-[1.12] mb-6">
              {headlineWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08 }}
                  className="inline-block mr-2.5 sm:mr-3.5"
                >
                  {word}
                </motion.span>
              ))}
              <motion.span
                initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.35 }}
                className="text-[#FFD60A] block sm:inline-block"
              >
                {headlineAccent}
              </motion.span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#A3A3A3] leading-relaxed mb-8 max-w-2xl">
              Connect directly with the K12 Hunar admissions committee, merit scholarship board, and festival teams. Every inquiry receives a dedicated reference code and a guaranteed 24-hour response.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-12">
              <Link
                to="/inquiry"
                className="px-6 py-3.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:bg-[#E6BF00] text-[#0A0A0A] font-bold text-sm shadow-lg shadow-[#FFD60A]/10 transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Submit an inquiry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/track"
                className="px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#F5F5F5] font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#FFD60A]" />
                <span>Track existing inquiry</span>
              </Link>
            </div>

            {/* Trust Badges Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#FFD60A] shrink-0" />
                <span className="text-xs text-[#F5F5F5] font-medium">Guaranteed reply in 24h</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span className="text-xs text-[#F5F5F5] font-medium">4 dedicated tracks</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#4ADE80] shrink-0" />
                <span className="text-xs text-[#F5F5F5] font-medium">Verified counselor response</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. "What Can We Help With" Section (Services) */}
        <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Programs & Categories
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              What can we help you with?
            </h2>
            <p className="text-sm text-[#A3A3A3] mt-2 max-w-xl">
              Choose your program stream. Click any category to start an inquiry with that track preselected.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scholarship Card */}
            <Link
              to="/inquiry?category=Scholarship"
              className="glass-card p-6 flex flex-col justify-between group hover:border-[#FFD60A]/40 transition-all cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 flex items-center justify-center text-[#FFD60A] mb-4 group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors mb-2">
                  Scholarships
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Merit scholarships, talent grants, and fee assistance programs for qualifying grade school students.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#FFD60A] flex items-center gap-1">
                <span>Inquire now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Admission Card */}
            <Link
              to="/inquiry?category=Admission"
              className="glass-card p-6 flex flex-col justify-between group hover:border-[#60A5FA]/40 transition-all cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA] mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-[#60A5FA] transition-colors mb-2">
                  Admissions
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Curriculum details, grade intake requirements, tuition timelines, and campus branch inquiries.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#60A5FA] flex items-center gap-1">
                <span>Inquire now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Concert Card */}
            <Link
              to="/inquiry?category=Concert"
              className="glass-card p-6 flex flex-col justify-between group hover:border-[#FB923C]/40 transition-all cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FB923C]/10 border border-[#FB923C]/30 flex items-center justify-center text-[#FB923C] mb-4 group-hover:scale-110 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-[#FB923C] transition-colors mb-2">
                  Concerts & Arts
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Annual music showcase, student auditions, stage performance registration, and audience passes.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#FB923C] flex items-center gap-1">
                <span>Inquire now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* General Query Card */}
            <Link
              to="/inquiry?category=General%20Query"
              className="glass-card p-6 flex flex-col justify-between group hover:border-[#A78BFA]/40 transition-all cursor-pointer"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] mb-4 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#F5F5F5] group-hover:text-[#A78BFA] transition-colors mb-2">
                  General Queries
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Institutional coordination, media requests, certificate verification, and custom requests.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#A78BFA] flex items-center gap-1">
                <span>Inquire now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </section>

        {/* 4. "Who It's For" Section */}
        <section id="who" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Stakeholders
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Designed for the entire school ecosystem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Parents */}
            <Link
              to="/inquiry?userType=Parent"
              className="glass-card p-8 group hover:border-[#FFD60A]/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center mb-6">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2 group-hover:text-[#FFD60A] transition-colors">
                  Parents & Guardians
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Get prompt answers on child evaluation criteria, fee schedules, and scholarship quotas from certified counselors.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#FFD60A]">
                <span>Inquire as a Parent</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Students */}
            <Link
              to="/inquiry?userType=Student"
              className="glass-card p-8 group hover:border-[#60A5FA]/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#60A5FA]/10 text-[#60A5FA] flex items-center justify-center mb-6">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2 group-hover:text-[#60A5FA] transition-colors">
                  Students
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Inquire directly about competition rules, stage auditions, creative portfolio submissions, and mentorship tracks.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#60A5FA]">
                <span>Inquire as a Student</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Schools */}
            <Link
              to="/inquiry?userType=School"
              className="glass-card p-8 group hover:border-[#4ADE80]/30 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80] flex items-center justify-center mb-6">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2 group-hover:text-[#4ADE80] transition-colors">
                  Schools & Institutions
                </h3>
                <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6">
                  Partner on inter-school festivals, coordinate cohort scholarship tests, and establish institutional program nodes.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-semibold text-[#4ADE80]">
                <span>Inquire as an Institution</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* 5. "How It Works" Section */}
        <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <div className="mb-14 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              From inquiry to answer in 24 hours
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-2">
              Every step is tracked in our CRM database with complete audit logging and status visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="glass-card p-6 relative">
              <span className="text-4xl font-extrabold text-white/10 absolute top-4 right-5 font-mono">
                01
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center mb-4 font-bold text-sm">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Submit Inquiry</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Select your category and fill out the quick contact form. Takes less than 60 seconds with no complex document uploads.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card p-6 relative border-[#FFD60A]/30">
              <span className="text-4xl font-extrabold text-white/10 absolute top-4 right-5 font-mono">
                02
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center mb-4 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Get Reference Code</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                You immediately receive a tracking code (e.g. <span className="font-mono text-[#FFD60A]">KH-XXXXXXXX</span>) to track live status updates at any time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card p-6 relative">
              <span className="text-4xl font-extrabold text-white/10 absolute top-4 right-5 font-mono">
                03
              </span>
              <div className="w-10 h-10 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80] flex items-center justify-center mb-4 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Counselor Review & Reply</h3>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                A verified counselor reviews your query, logs internal notes, and connects with you directly with comprehensive guidance.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Live Trust Strip (Connected to /api/public/stats) */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-card p-8 bg-gradient-to-r from-white/[0.03] to-white/[0.01] border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <div className="pt-4 sm:pt-0">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#FFD60A] block tabular-nums">
                  {stats.handledApprox}+
                </span>
                <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-1 block">
                  Inquiries Processed
                </span>
              </div>
              <div className="pt-4 sm:pt-0 sm:pl-8">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] block tabular-nums">
                  &lt; {Math.ceil(stats.avgFirstResponseHours)}h
                </span>
                <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-1 block">
                  Median First Response
                </span>
              </div>
              <div className="pt-4 sm:pt-0 sm:pl-8">
                <span className="text-3xl sm:text-4xl font-extrabold text-[#4ADE80] block tabular-nums">
                  100%
                </span>
                <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-1 block">
                  Response Commitment
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ Section */}
        <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-20">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="glass-card overflow-hidden border-white/10 transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#FFD60A]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#F5F5F5]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#FFD60A] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#A3A3A3] leading-relaxed border-t border-white/5">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. Final CTA Band */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="glass-card p-8 sm:p-12 relative overflow-hidden text-center border-[#FFD60A]/30 glow-yellow-sm">
            <div className="max-w-2xl mx-auto relative z-10">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
                Ready to take the next step?
              </h2>
              <p className="text-sm text-[#A3A3A3] mb-8">
                Submit an inquiry today or check the status of your existing application with your reference code.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <Link
                  to="/inquiry"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:bg-[#E6BF00] text-[#0A0A0A] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Submit an inquiry now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/track"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5F5F5] font-semibold text-sm transition-all"
                >
                  Track existing inquiry
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Public Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-[#A3A3A3]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-xs">
              H
            </div>
            <span className="font-bold text-[#F5F5F5]">K12 Hunar CRM & Inquiry Portal</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link to="/inquiry" className="hover:text-[#F5F5F5] transition-colors">
              Submit Inquiry
            </Link>
            <Link to="/track" className="hover:text-[#F5F5F5] transition-colors">
              Track Status
            </Link>
            <Link to="/admin/login" className="hover:text-[#FFD60A] transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} K12 Hunar. All rights reserved.</p>
          <p className="text-[#A3A3A3]/70">Built for high-performance EdTech inquiry operations.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
