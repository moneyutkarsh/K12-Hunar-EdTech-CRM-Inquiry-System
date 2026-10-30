import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Clock, AlertCircle, Loader2, CheckCircle2, CircleDot, Hash, Mail, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { RefineFrame, type RefineFrameStage } from '../components/ui/RefineFrame';

interface TrackTimelineEvent {
  event: string;
  label: string;
  timestamp: string;
}

interface TrackResult {
  reference: string;
  category: string;
  status: 'New' | 'In Progress' | 'Resolved' | string;
  createdAt: string;
  updatedAt: string;
  timeline: TrackTimelineEvent[];
}

export const PublicTrackerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [reference, setReference] = useState(initialRef);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  const getStage = (): RefineFrameStage => {
    if (isLoading) return 'validating';
    if (error) return 'error';
    if (result) return 'ready';
    return 'idle';
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !email.trim()) {
      setError('Please enter both your reference code and email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.post('/track', {
        reference: reference.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'No inquiry found for those details. Please check your reference code and email.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'Received', label: 'Received', sublabel: 'Inquiry logged' },
    { id: 'In Progress', label: 'In Review', sublabel: 'Counselor reviewing' },
    { id: 'Resolved', label: 'Resolved', sublabel: 'Action completed' },
  ];

  const getStepStatus = (stepId: string, currentStatus: string) => {
    const currentIdx = currentStatus === 'New' ? 0 : currentStatus === 'In Progress' ? 1 : 2;
    const stepIdx = stepId === 'Received' ? 0 : stepId === 'In Progress' ? 1 : 2;

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-[#FFD60A] transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <RefineFrame
          status={getStage()}
          labels={{
            idle: 'Tracker Online',
            validating: 'Locating Inquiry...',
            ready: 'Record Verified',
            error: 'Inquiry Not Found',
          }}
          sweep={true}
          className="shadow-2xl"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#FFD60A]/10 border border-[#FFD60A]/20 text-[#FFD60A] flex items-center justify-center shadow-[0_0_15px_rgba(255,214,10,0.15)]">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight">
                  Track Your Inquiry
                </h1>
                <p className="text-xs text-[#A3A3A3]">
                  Enter your reference code and registered email below.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#A3A3A3] mb-6 pt-2 border-t border-white/5">
              Format: <span className="font-mono text-[#FFD60A] bg-[#FFD60A]/10 px-1.5 py-0.5 rounded border border-[#FFD60A]/20">KH-XXXXXXXX</span> matching your submission receipt.
            </p>

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label htmlFor="reference" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Reference Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Hash className="w-4 h-4 text-[#FFD60A]" />
                  </div>
                  <input
                    id="reference"
                    type="text"
                    placeholder="KH-A8B9C2D3"
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3.5 py-2.5 dark-input text-sm uppercase font-mono tracking-wider focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A]/50 bg-black/40"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                  Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Mail className="w-4 h-4 text-[#FFD60A]" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 dark-input text-sm focus:border-[#FFD60A] focus:ring-1 focus:ring-[#FFD60A]/50 bg-black/40"
                    required
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="p-3.5 rounded-xl bg-[#F87171]/10 border border-[#F87171]/25 flex items-center gap-2.5 text-xs text-[#F87171] animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-shine-effect w-full py-3.5 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-sm shadow-[0_0_20px_rgba(255,214,10,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Locating inquiry record...</span>
                  </>
                ) : (
                  <>
                    <span>Check Status</span>
                    <Search className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </form>

            {/* 1-click sample tracker shortcuts */}
            {!result && (
              <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-[11px] text-[#A3A3A3]">
                <p className="text-white/60 mb-2.5 font-medium flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>Click to autofill sample inquiries:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReference('KH-ES2XFRZV');
                      setEmail('rohan.mehra@outlook.com');
                      setError(null);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[#FFD60A]/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-mono text-xs font-bold text-[#FFD60A] group-hover:underline">
                      KH-ES2XFRZV
                    </div>
                    <div className="text-[10px] text-white/50 truncate">rohan.mehra@outlook.com</div>
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-[#FFD60A]/10 text-[#FFD60A] border border-[#FFD60A]/20">
                      Scholarship
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReference('KH-WNMT8WWC');
                      setEmail('aditya.v@gmail.com');
                      setError(null);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[#60A5FA]/40 text-left transition-all cursor-pointer group"
                  >
                    <div className="font-mono text-xs font-bold text-[#60A5FA] group-hover:underline">
                      KH-WNMT8WWC
                    </div>
                    <div className="text-[10px] text-white/50 truncate">aditya.v@gmail.com</div>
                    <span className="inline-block mt-1 text-[9px] px-1.5 py-0.2 rounded bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">
                      Admission
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Result view */}
            {result && (
              <div
                role="region"
                aria-live="polite"
                className="mt-6 pt-6 border-t border-white/10 space-y-5 animate-fade-in"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider block">Reference</span>
                    <span className="font-mono text-base font-extrabold text-[#FFD60A] tracking-wider">{result.reference}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider block text-right">Current Status</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                        result.status === 'Resolved'
                          ? 'bg-[#4ADE80]/15 text-[#4ADE80] border border-[#4ADE80]/30'
                          : result.status === 'In Progress'
                          ? 'bg-[#FB923C]/15 text-[#FB923C] border border-[#FB923C]/30'
                          : 'bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/30'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-[#A3A3A3] mb-3">Progress Pipeline</div>
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 -z-0" />
                    {steps.map((st, idx) => {
                      const stepState = getStepStatus(st.id, result.status);
                      return (
                        <div key={idx} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                              stepState === 'completed'
                                ? 'bg-[#4ADE80] text-black shadow-md shadow-[#4ADE80]/20'
                                : stepState === 'current'
                                ? 'bg-[#FFD60A] text-black font-bold ring-4 ring-[#FFD60A]/20'
                                : 'bg-white/10 text-[#A3A3A3] border border-white/15'
                            }`}
                          >
                            {stepState === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-black" />
                            ) : stepState === 'current' ? (
                              <CircleDot className="w-4 h-4 text-black animate-pulse" />
                            ) : (
                              <span className="text-[11px] font-semibold">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-[11px] mt-1.5 font-semibold text-center ${
                              stepState === 'current'
                                ? 'text-[#FFD60A]'
                                : stepState === 'completed'
                                ? 'text-[#F5F5F5]'
                                : 'text-[#737373]'
                            }`}
                          >
                            {st.label}
                          </span>
                          <span className="text-[9px] text-[#A3A3A3] hidden sm:block text-center">{st.sublabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inquiry Details */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#A3A3A3]">
                    <span>Track Category:</span>
                    <span className="text-[#F5F5F5] font-semibold">{result.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#A3A3A3]">
                    <span>Submitted on:</span>
                    <span className="text-[#F5F5F5]">{new Date(result.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#A3A3A3]">
                    <span>Last status update:</span>
                    <span className="text-[#F5F5F5]">{new Date(result.updatedAt).toLocaleString()}</span>
                  </div>
                  {result.status !== 'Resolved' && (
                    <div className="flex items-center gap-1.5 text-[#FFD60A] pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimated response: within 24 hours</span>
                    </div>
                  )}
                </div>

                {/* Public Timeline */}
                {result.timeline && result.timeline.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider block">Timeline History</span>
                    <div className="space-y-2 border-l border-white/10 pl-3 ml-1.5">
                      {result.timeline.map((item, i) => (
                        <div key={i} className="relative text-xs">
                          <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-[#FFD60A]" />
                          <div className="font-semibold text-[#F5F5F5]">{item.label}</div>
                          <div className="text-[10px] text-[#737373]">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </RefineFrame>
      </div>
    </div>
  );
};

export default PublicTrackerPage;
