import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { GooeyNav, type GooeyNavItem } from '../components/ui/GooeyNav';
import {
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
  ChevronUp,
} from 'lucide-react';
import { api } from '../lib/api';
import { Reveal } from '../components/ui/Reveal';
import { MOTION_CONSTANTS } from '../constants/motion';

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

const REASSURANCE_COPY = 'No signup needed · Takes about 2 minutes · Free';

const MARQUEE_ITEMS = [
  { label: 'Scholarships & Grants', type: 'category', icon: Award },
  { label: 'Admissions & Intake', type: 'category', icon: BookOpen },
  { label: 'Concerts & Showcases', type: 'category', icon: Music },
  { label: 'General Inquiries', type: 'category', icon: HelpCircle },
  { label: 'Parents & Guardians', type: 'audience', icon: Users },
  { label: 'Grade Students', type: 'audience', icon: GraduationCap },
  { label: 'Schools & Coordinators', type: 'audience', icon: Building2 },
];

export const HomePage: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);
  const [spotlightPos, setSpotlightPos] = useState<Record<string, { x: number; y: number } | null>>({});
  const navigate = useNavigate();

  const gooeyNavItems: GooeyNavItem[] = useMemo(
    () => [
      { label: 'Programs & Services', href: '#services' },
      { label: "Who It's For", href: '#who' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'FAQ', href: '#faq' },
      {
        label: 'Track Inquiry',
        href: '/track',
        icon: <Search className="w-3.5 h-3.5" />,
        onClick: (e) => {
          e.preventDefault();
          navigate('/track');
        },
      },
    ],
    [navigate]
  );

  const sectionIndexMap: Record<string, number> = useMemo(
    () => ({
      services: 0,
      who: 1,
      'how-it-works': 2,
      faq: 3,
    }),
    []
  );

  const activeNavIndex =
    activeSection && sectionIndexMap[activeSection] !== undefined
      ? sectionIndexMap[activeSection]
      : 0;

  // Navbar glass transition on scroll (24px threshold)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 24);
      if (scrollY > 100) {
        setHasScrolledPastHero(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-spy IntersectionObserver for active link indicator
  useEffect(() => {
    const sections = ['services', 'who', 'how-it-works', 'faq'];
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Body scroll lock and Escape key listener for mobile sheet
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen]);

  // Fetch live aggregate stats from public endpoint (only show if success)
  useEffect(() => {
    let isMounted = true;
    api
      .get('/public/stats')
      .then((res) => {
        if (isMounted && res.data) {
          setStats({
            handledApprox: res.data.handledApprox ?? 0,
            resolvedPct: res.data.resolvedPct ?? 0,
            avgFirstResponseHours: res.data.avgFirstResponseHours ?? 0,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setStats(null); // Explicit rule: hide stat block if API call fails
        }
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

  // Bento Spotlight handler
  const handleBentoMouseMove = (id: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpotlightPos((prev) => ({
      ...prev,
      [id]: { x: e.clientX - rect.left, y: e.clientY - rect.top },
    }));
  };

  const handleBentoMouseLeave = (id: string) => {
    setSpotlightPos((prev) => ({ ...prev, [id]: null }));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  const headlineWords = ['Scholarships,', 'admissions', 'and', 'concerts.'];
  const headlineAccent = 'One place to ask.';

  return (
    <div className="relative min-h-screen text-[#F5F5F5] font-sans selection:bg-[#FFD60A] selection:text-[#0A0A0A]">
      {/* Skip to Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-[#FFD60A] text-[#0A0A0A] font-bold rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFD60A] focus:ring-offset-2 focus:ring-offset-[#050505]"
      >
        Skip to main content
      </a>

      {/* 1. Public Navbar (Phase 5: Transparent at top, glass on scroll with sliding spy indicator) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${isScrolled
          ? 'h-14 bg-[#050505]/70 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/40'
          : 'h-16 bg-transparent border-b border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo & Brand Pill */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-[#FFD60A] rounded-lg">
            <img
              src="/k12_hunar_logo.png"
              alt="K12 Hunar"
              className="w-9 h-9 rounded-lg object-contain bg-black/60 border border-white/10 group-hover:border-[#FFD60A]/40 shadow-sm group-hover:scale-105 transition-all duration-200"
            />
            <span className="font-bold text-base tracking-tight text-[#F5F5F5] group-hover:text-white transition-colors">
              K12 Hunar
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20">
              Portal
            </span>
          </Link>

          {/* Desktop GooeyNav Navigation Bar (React Bits Liquid Blob Physics) */}
          <div className="hidden md:flex items-center">
            <GooeyNav
              items={gooeyNavItems}
              activeIndex={activeNavIndex}
              color="#FFD60A"
              activeTextColor="#0A0A0A"
              theme="dark"
              size="sm"
              frame={true}
              gooeyness={0.55}
              particleCount={14}
              animationTime={500}
              wobble={0.45}
            />
          </div>

          {/* CTA & Sign in / Sign up Links */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/admin/login"
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
            >
              Sign in
            </Link>
            <Link
              to="/admin/login?mode=signup"
              className="btn-shine-effect px-4 py-2 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:scale-[0.98] text-[#0A0A0A] text-xs font-bold shadow-md transition-all flex items-center gap-1.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 focus:ring-offset-2 focus:ring-offset-[#050505]"
            >
              <span>Sign up</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-white/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Full-Height Glass Sheet with Body Scroll Lock & Focus Trap */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-2xl flex flex-col justify-between p-6 pt-20 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#A3A3A3] hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
              aria-label="Close Navigation Menu"
            >
              <X className="w-6 h-6" />
            </button>

            <nav className="flex flex-col space-y-4">
              {[
                { label: 'Programs & Services', href: '#services' },
                { label: "Who It's For", href: '#who' },
                { label: 'How It Works', href: '#how-it-works' },
                { label: 'Frequently Asked Questions', href: '#faq' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-3 text-lg font-semibold text-[#F5F5F5] hover:text-[#FFD60A] transition-colors border-b border-white/5 min-h-[44px] flex items-center"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/track"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-3 text-lg font-semibold text-[#FFD60A] transition-colors border-b border-white/5 min-h-[44px] flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Track Existing Inquiry</span>
              </Link>
            </nav>

            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <Link
                to="/admin/login?mode=signup"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-shine-effect w-full py-4 rounded-xl bg-[#FFD60A] active:scale-[0.98] text-[#0A0A0A] font-bold text-center text-base shadow-lg shadow-[#FFD60A]/10 min-h-[44px] flex items-center justify-center gap-2"
              >
                <span>Sign up</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 rounded-lg text-center text-sm text-[#A3A3A3] hover:text-[#F5F5F5] min-h-[44px] flex items-center justify-center"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Page Landmark */}
      <main id="main-content" className="pt-16">
        {/* 2. Left-Aligned Impactful Hero Section */}
        <section
          id="home-hero-section"
          className="relative min-h-[calc(100svh-4rem)] flex flex-col justify-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16 pb-24"
        >
          <div className="max-w-3xl text-left">
            {/* Headline with word stagger, clamp, text-wrap balance, and animated underline */}
            <h1
              className="font-extrabold text-[#F5F5F5] tracking-tight leading-[1.04] mb-8"
              style={{
                fontSize: 'clamp(2.75rem, 5.8vw, 5.25rem)',
                letterSpacing: '-0.035em',
                textWrap: 'balance',
              }}
            >
              {headlineWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: idx * MOTION_CONSTANTS.heroLoadSequence.headlineWordStagger,
                  }}
                  className="inline-block mr-2.5 sm:mr-3.5"
                >
                  {word}
                </motion.span>
              ))}
              <span className="relative inline-block text-[#FFD60A]">
                <motion.span
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="inline-block"
                >
                  {headlineAccent}
                </motion.span>
                {/* Thin animated SVG underline stroke */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-2 overflow-visible pointer-events-none"
                  viewBox="0 0 240 8"
                  fill="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M2 6C60 2 180 2 238 6"
                    stroke="#FFD60A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.65, delay: 0.45, ease: 'easeOut' }}
                  />
                </svg>
              </span>
            </h1>

            {/* Subheading: #B8B8B8, max-w-56ch, text-wrap pretty */}
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: MOTION_CONSTANTS.heroLoadSequence.subhead }}
              className="text-[#B8B8B8] leading-[1.65] mb-8"
              style={{
                maxWidth: '54ch',
                fontSize: 'clamp(1.05rem, 1.4vw, 1.25rem)',
                textWrap: 'pretty',
              }}
            >
              Connect directly with the K12 Hunar admissions committee, merit scholarship board, and festival teams. Every inquiry receives a dedicated{' '}
              <span className="text-[#F5F5F5] font-medium">reference code</span> and a guaranteed{' '}
              <span className="text-[#F5F5F5] font-medium">24-hour response</span>.
            </motion.p>

            {/* Dual CTAs */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: MOTION_CONSTANTS.heroLoadSequence.ctas }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-3"
            >
              <Link
                to="/inquiry"
                className="btn-shine-effect px-6 py-3.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:scale-[0.98] text-[#0A0A0A] font-bold text-sm shadow-lg shadow-[#FFD60A]/15 transition-all flex items-center justify-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 focus:ring-offset-2 focus:ring-offset-[#050505] min-h-[44px]"
              >
                <span>Submit an inquiry</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/track"
                className="glass-card px-6 py-3.5 rounded-xl hover:border-[#FFD60A]/50 hover:bg-white/[0.08] text-[#F5F5F5] font-semibold text-sm transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 focus:ring-offset-2 focus:ring-offset-[#050505] min-h-[44px]"
              >
                <Search className="w-4 h-4 text-[#FFD60A] group-hover:scale-110 transition-transform" />
                <span>Track existing inquiry</span>
              </Link>
            </motion.div>

            {/* Reassurance Microcopy */}
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.48 }}
              className="text-xs text-[#A3A3A3] mb-8"
            >
              {REASSURANCE_COPY}
            </motion.p>

            {/* Trust Badges Row */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: MOTION_CONSTANTS.heroLoadSequence.chips }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { icon: Clock, text: 'Guaranteed reply in 24h' },
                { icon: Layers, text: '4 dedicated tracks' },
                { icon: ShieldCheck, text: 'Verified counselor response' },
              ].map((chip, idx) => {
                const Icon = chip.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#FFD60A]/30 transition-colors flex items-center gap-2.5 h-12"
                  >
                    <Icon className="w-4 h-4 text-[#FFD60A] shrink-0" />
                    <span className="text-xs text-[#F5F5F5] font-medium">{chip.text}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Scroll Cue at Bottom of Hero */}
          {!hasScrolledPastHero && !prefersReducedMotion && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-xs text-[#A3A3A3] pointer-events-none transition-opacity duration-300"
              aria-hidden="true"
            >
              <div
                className="w-5 h-8 rounded-full border-2 border-white/20 flex items-start justify-center p-1"
                style={{ animation: 'bob-cue 2s ease-in-out infinite' }}
              >
                <div className="w-1 h-2 rounded-full bg-[#FFD60A]" />
              </div>
            </div>
          )}

          {/* Bottom Edge Animated Gradient Divider */}
          <div
            className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-[#FFD60A]/30 to-transparent"
            aria-hidden="true"
          />
        </section>

        {/* Phase 6a: Category Strip (Marquee under Hero with Pause-on-Hover) */}
        <section className="py-6 border-y border-white/[0.06] bg-white/[0.01] overflow-hidden" aria-label="Program Tracks">
          <div className="max-w-7xl mx-auto px-4">
            {prefersReducedMotion ? (
              <div className="flex flex-wrap gap-2.5 justify-center">
                {MARQUEE_ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-[#F5F5F5] font-medium flex items-center gap-2"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#FFD60A]" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="marquee-track flex gap-4">
                {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 hover:border-[#FFD60A]/40 text-xs text-[#F5F5F5] font-medium flex items-center gap-2 whitespace-nowrap transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#FFD60A]" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* 3. Services: Bento Grid with Cursor Spotlight (Phase 6b) */}
        <section id="services" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <Reveal className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Programs & Categories
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              What can we help you with?
            </h2>
            <p className="text-sm text-[#A3A3A3] mt-2 max-w-xl">
              Choose your program stream. Click any category to start an inquiry with that track preselected.
            </p>
          </Reveal>

          {/* Bento Grid: 1 large feature card for Scholarship, 3 smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Large Feature Card: Scholarships (Spans 2 columns on desktop) */}
            <Reveal className="md:col-span-2">
              <Link
                to="/inquiry?category=Scholarship"
                onMouseMove={(e) => handleBentoMouseMove('scholarship', e)}
                onMouseLeave={() => handleBentoMouseLeave('scholarship')}
                className="glass-card p-8 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 hover:border-[#FFD60A]/40 transition-all cursor-pointer relative overflow-hidden h-full min-h-[260px] focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
                style={{
                  background: spotlightPos['scholarship']
                    ? `radial-gradient(350px circle at ${spotlightPos['scholarship'].x}px ${spotlightPos['scholarship'].y}px, rgba(255, 214, 10, 0.12), rgba(255, 255, 255, 0.04) 70%)`
                    : undefined,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFD60A]/10 border border-[#FFD60A]/30 flex items-center justify-center text-[#FFD60A] group-hover:scale-110 transition-transform">
                      <Award className="w-7 h-7" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20">
                      Featured Program
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#F5F5F5] group-hover:text-[#FFD60A] transition-colors mb-3">
                    Scholarships & Grants
                  </h3>
                  <p className="text-sm text-[#A3A3A3] leading-relaxed max-w-xl mb-6">
                    Merit scholarships, talent grants, and fee assistance programs for qualifying grade school students. Fully funded by our foundation partners.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-semibold text-[#FFD60A] flex items-center gap-1.5">
                    <span>Inquire for scholarship</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </span>
                  <span className="text-xs text-[#A3A3A3]">Zero application fee</span>
                </div>
              </Link>
            </Reveal>

            {/* 2. Admissions Card */}
            <Reveal delay={0.1}>
              <Link
                to="/inquiry?category=Admission"
                onMouseMove={(e) => handleBentoMouseMove('admission', e)}
                onMouseLeave={() => handleBentoMouseLeave('admission')}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 hover:border-[#60A5FA]/40 transition-all cursor-pointer relative overflow-hidden h-full min-h-[260px] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
                style={{
                  background: spotlightPos['admission']
                    ? `radial-gradient(280px circle at ${spotlightPos['admission'].x}px ${spotlightPos['admission'].y}px, rgba(96, 165, 250, 0.12), rgba(255, 255, 255, 0.04) 70%)`
                    : undefined,
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#60A5FA]/10 border border-[#60A5FA]/30 flex items-center justify-center text-[#60A5FA] mb-5 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#60A5FA] transition-colors mb-2">
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
            </Reveal>

            {/* 3. Concerts & Arts Card */}
            <Reveal delay={0.15}>
              <Link
                to="/inquiry?category=Concert"
                onMouseMove={(e) => handleBentoMouseMove('concert', e)}
                onMouseLeave={() => handleBentoMouseLeave('concert')}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 hover:border-[#FB923C]/40 transition-all cursor-pointer relative overflow-hidden h-full min-h-[260px] focus:outline-none focus:ring-2 focus:ring-[#FB923C]"
                style={{
                  background: spotlightPos['concert']
                    ? `radial-gradient(280px circle at ${spotlightPos['concert'].x}px ${spotlightPos['concert'].y}px, rgba(251, 146, 60, 0.12), rgba(255, 255, 255, 0.04) 70%)`
                    : undefined,
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FB923C]/10 border border-[#FB923C]/30 flex items-center justify-center text-[#FB923C] mb-5 group-hover:scale-110 transition-transform">
                    <Music className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#FB923C] transition-colors mb-2">
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
            </Reveal>

            {/* 4. General Queries Card (Spans 2 columns on desktop) */}
            <Reveal delay={0.2} className="md:col-span-2">
              <Link
                to="/inquiry?category=General%20Query"
                onMouseMove={(e) => handleBentoMouseMove('general', e)}
                onMouseLeave={() => handleBentoMouseLeave('general')}
                className="glass-card p-6 rounded-2xl flex flex-col justify-between group hover:-translate-y-1 hover:border-[#A78BFA]/40 transition-all cursor-pointer relative overflow-hidden h-full min-h-[220px] focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                style={{
                  background: spotlightPos['general']
                    ? `radial-gradient(350px circle at ${spotlightPos['general'].x}px ${spotlightPos['general'].y}px, rgba(167, 139, 250, 0.12), rgba(255, 255, 255, 0.04) 70%)`
                    : undefined,
                }}
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] mb-5 group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#A78BFA] transition-colors mb-2">
                    General Queries
                  </h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-6 max-w-xl">
                    Institutional coordination, media requests, certificate verification, and custom requests.
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#A78BFA] flex items-center gap-1">
                  <span>Inquire now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Gradient Hairline Divider between Sections */}
        <div className="max-w-7xl mx-auto px-4"><div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

        {/* 4. "Who It's For" Section (Phase 6c) */}
        <section id="who" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <Reveal className="mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Stakeholders
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Designed for the entire school ecosystem
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Parents */}
            <Reveal>
              <Link
                to="/inquiry?userType=Parent"
                className="glass-card p-8 rounded-2xl group hover:-translate-y-1 hover:border-[#FFD60A]/40 transition-all cursor-pointer flex flex-col justify-between h-full focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-[#A3A3A3]/60">01</span>
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
            </Reveal>

            {/* Students */}
            <Reveal delay={0.1}>
              <Link
                to="/inquiry?userType=Student"
                className="glass-card p-8 rounded-2xl group hover:-translate-y-1 hover:border-[#60A5FA]/40 transition-all cursor-pointer flex flex-col justify-between h-full focus:outline-none focus:ring-2 focus:ring-[#60A5FA]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#60A5FA]/10 text-[#60A5FA] flex items-center justify-center">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-[#A3A3A3]/60">02</span>
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
            </Reveal>

            {/* Schools */}
            <Reveal delay={0.2}>
              <Link
                to="/inquiry?userType=School"
                className="glass-card p-8 rounded-2xl group hover:-translate-y-1 hover:border-[#4ADE80]/40 transition-all cursor-pointer flex flex-col justify-between h-full focus:outline-none focus:ring-2 focus:ring-[#4ADE80]"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#4ADE80]/10 text-[#4ADE80] flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono text-[#A3A3A3]/60">03</span>
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
            </Reveal>
          </div>
        </section>

        {/* Gradient Hairline Divider between Sections */}
        <div className="max-w-7xl mx-auto px-4"><div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

        {/* 5. "How It Works" Section with Animated Connector Line (Phase 6d) */}
        <section id="how-it-works" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-20">
          <Reveal className="mb-14 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Simple 3-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              From inquiry to answer in 24 hours
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-2">
              Every step is tracked in our CRM database with complete audit logging and status visibility.
            </p>
          </Reveal>

          <div className="relative">
            {/* Desktop Horizontal Connecting Line that draws into view */}
            <div className="hidden md:block absolute top-[68px] left-[15%] right-[15%] h-0.5 bg-white/10 -z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-[#FFD60A] via-[#FFD60A] to-[#4ADE80]"
                initial={prefersReducedMotion ? false : { width: '0%' }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {/* Step 1 */}
              <Reveal delay={0}>
                <div className="glass-card p-6 rounded-2xl relative bg-[#0A0A0A]/90 hover:border-[#FFD60A]/40 transition-colors h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center font-bold text-sm ring-4 ring-[#050505]">
                      <Send className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-white/10 font-mono">01</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Submit Inquiry</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-4">
                    Select your category and fill out the quick contact form. Takes less than 60 seconds with no complex document uploads.
                  </p>
                  {/* Inline Mini SVG Illustration */}
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#A3A3A3]">
                    <svg className="w-4 h-4 text-[#FFD60A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="13" y2="12" />
                    </svg>
                    <span>Instant form prefill</span>
                  </div>
                </div>
              </Reveal>

              {/* Step 2 */}
              <Reveal delay={0.15}>
                <div className="glass-card p-6 rounded-2xl relative border-[#FFD60A]/30 bg-[#0A0A0A]/90 hover:border-[#FFD60A]/50 transition-colors h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FFD60A] text-[#0A0A0A] flex items-center justify-center font-bold text-sm ring-4 ring-[#050505] shadow-lg shadow-[#FFD60A]/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-white/10 font-mono">02</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Get Reference Code</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-4">
                    You immediately receive a tracking code (e.g. <span className="font-mono text-[#FFD60A]">KH-XXXXXXXX</span>) to track live status updates at any time.
                  </p>
                  {/* Inline Mini SVG Illustration */}
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#FFD60A]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span>Unique audit trail</span>
                  </div>
                </div>
              </Reveal>

              {/* Step 3 */}
              <Reveal delay={0.3}>
                <div className="glass-card p-6 rounded-2xl relative bg-[#0A0A0A]/90 hover:border-[#4ADE80]/40 transition-colors h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4ADE80]/10 text-[#4ADE80] flex items-center justify-center font-bold text-sm ring-4 ring-[#050505]">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-white/10 font-mono">03</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F5] mb-2">Counselor Review & Reply</h3>
                  <p className="text-xs text-[#A3A3A3] leading-relaxed mb-4">
                    A verified counselor reviews your query, logs internal notes, and connects with you directly with comprehensive guidance.
                  </p>
                  {/* Inline Mini SVG Illustration */}
                  <div className="pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-[#4ADE80]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Direct phone & email resolution</span>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 6. Live Trust Strip (Phase 6e: Count-Up, Tabular-Nums, Hairline Dividers, Only if API succeeds) */}
        {stats && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" aria-label="Operational Statistics">
            <Reveal>
              <div className="glass-card p-8 rounded-2xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                  <div className="pt-4 sm:pt-0">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#FFD60A] block tabular-nums">
                      {stats.handledApprox}+
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-2 block">
                      Inquiries Processed
                    </span>
                  </div>
                  <div className="pt-4 sm:pt-0 sm:pl-8">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F5] block tabular-nums">
                      &lt; {Math.ceil(stats.avgFirstResponseHours || 10)}h
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-2 block">
                      Median First Response
                    </span>
                  </div>
                  <div className="pt-4 sm:pt-0 sm:pl-8">
                    <span className="text-3xl sm:text-5xl font-extrabold text-[#4ADE80] block tabular-nums">
                      100%
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#A3A3A3] font-semibold mt-2 block">
                      Response Commitment
                    </span>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        )}

        {/* Gradient Hairline Divider between Sections */}
        <div className="max-w-7xl mx-auto px-4"><div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" /></div>

        {/* 7. FAQ Section (Phase 6f: Rotating Plus/Chevron, Smooth Height, Accent Line) */}
        <section id="faq" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto scroll-mt-20">
          <Reveal className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFD60A] block mb-2">
              Common Questions
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight">
              Frequently Asked Questions
            </h2>
          </Reveal>

          <div className="space-y-3.5">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <Reveal key={index} delay={index * 0.04}>
                  <div
                    className={`glass-card rounded-xl overflow-hidden transition-all duration-200 border-white/10 ${isOpen ? 'border-l-4 border-l-[#FFD60A] bg-white/[0.04]' : 'hover:border-white/20'
                      }`}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFD60A] rounded-xl"
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#F5F5F5]">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#FFD60A] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                          }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#A3A3A3] leading-relaxed border-t border-white/5">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* 8. Final CTA Band (Phase 6g: Wide glass card with yellow glow, CSS fiber echo, 2 hero-style buttons) */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <Reveal>
            <div className="glass-card rounded-3xl p-8 sm:p-14 relative overflow-hidden text-center border-[#FFD60A]/30 glow-yellow-md bg-[#0A0A0A]/95">
              {/* CSS Fiber Echo in background */}
              <div
                className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 214, 10, 0.4) 0%, rgba(251, 146, 60, 0.2) 50%, transparent 70%)',
                }}
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 214, 10, 0.3) 0%, transparent 70%)',
                }}
                aria-hidden="true"
              />

              <div className="max-w-2xl mx-auto relative z-10">
                <h2 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F5] tracking-tight mb-4">
                  Ready to take the next step?
                </h2>
                <p className="text-sm text-[#A3A3A3] mb-8 leading-relaxed">
                  Submit an inquiry today or check the status of your existing application with your reference code.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                  <Link
                    to="/inquiry"
                    className="btn-shine-effect w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] active:scale-[0.98] text-[#0A0A0A] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 focus:ring-offset-2 focus:ring-offset-[#050505] min-h-[44px]"
                  >
                    <span>Submit an inquiry now</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/track"
                    className="glass-card w-full sm:w-auto px-6 py-3.5 rounded-xl hover:border-[#FFD60A]/50 hover:bg-white/[0.08] text-[#F5F5F5] font-semibold text-sm transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]/50 focus:ring-offset-2 focus:ring-offset-[#050505] min-h-[44px]"
                  >
                    <Search className="w-4 h-4 text-[#FFD60A]" />
                    <span>Track existing inquiry</span>
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* 9. Public Footer (Phase 6h: 4 Columns, Gradient Border, Back-to-Top Button) */}
      <footer className="border-t border-white/10 pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-[#A3A3A3] bg-[#050505]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & One-line Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src="/k12_hunar_logo.png"
                alt="K12 Hunar"
                className="w-8 h-8 rounded-lg object-contain bg-black/60 border border-white/10 shadow-sm"
              />
              <span className="font-bold text-base text-[#F5F5F5]">K12 Hunar</span>
            </div>
            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              Transparent, guaranteed 24-hour admissions and scholarship inquiry portal for grade schools across India.
            </p>
          </div>

          {/* Col 2: Navigate */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] mb-4">
              Navigate
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#services" className="hover:text-[#FFD60A] transition-colors">
                  Programs & Services
                </a>
              </li>
              <li>
                <a href="#who" className="hover:text-[#FFD60A] transition-colors">
                  Who It's For
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#FFD60A] transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#FFD60A] transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/inquiry" className="hover:text-[#F5F5F5] transition-colors">
                  Submit Inquiry
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-[#F5F5F5] transition-colors">
                  Track Inquiry
                </Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-[#FFD60A] transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Back to Top & Office IST */}
          <div className="flex flex-col justify-between items-start md:items-end">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5F5F5] mb-2 md:text-right">
                Office Hours
              </h4>
              <p className="text-xs text-[#A3A3A3] md:text-right">
                Monday – Saturday<br />9:00 AM – 6:00 PM IST
              </p>
            </div>
            <button
              onClick={scrollToTop}
              className="mt-6 glass-card px-3.5 py-2 rounded-xl text-xs font-semibold text-[#F5F5F5] hover:text-[#FFD60A] hover:border-[#FFD60A]/40 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#FFD60A]"
            >
              <span>Back to top</span>
              <ChevronUp className="w-4 h-4 text-[#FFD60A]" />
            </button>
          </div>
        </div>

        {/* Small Print Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A3A3A3]/70">
          <p>© {new Date().getFullYear()} K12 Hunar. All rights reserved.</p>
          <p>Built for high-performance EdTech inquiry operations.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
