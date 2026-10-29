import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

export const PublicTrackerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';
  const [reference, setReference] = useState(initialRef);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

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

        <div className="glass-card p-6 sm:p-8 border-white/10 shadow-2xl">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#FFD60A]/10 text-[#FFD60A] flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#F5F5F5] tracking-tight">
              Track Your Inquiry
            </h1>
          </div>
          <p className="text-xs text-[#A3A3A3] mb-6">
            Enter your 8-character reference code (e.g. <span className="font-mono text-[#FFD60A]">KH-XXXXXXXX</span>) and the email address used during submission.
          </p>

          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label htmlFor="reference" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Reference Code
              </label>
              <input
                id="reference"
                type="text"
                placeholder="KH-A8B9C2D3"
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 dark-input text-sm uppercase font-mono tracking-wider"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#A3A3A3] mb-1.5">
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 dark-input text-sm"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="p-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 flex items-center gap-2 text-xs text-[#F87171]"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#FFD60A] hover:bg-[#FFE14D] text-[#0A0A0A] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking status...</span>
                </>
              ) : (
                <span>Check Status</span>
              )}
            </button>
          </form>

          {/* Result view */}
          {result && (
            <div
              role="region"
              aria-live="polite"
              className="mt-6 pt-6 border-t border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider block">Reference</span>
                  <span className="font-mono text-sm font-bold text-[#FFD60A]">{result.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#A3A3A3] uppercase tracking-wider block text-right">Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      result.status === 'Resolved'
                        ? 'bg-[#4ADE80]/15 text-[#4ADE80]'
                        : result.status === 'In Progress'
                        ? 'bg-[#FB923C]/15 text-[#FB923C]'
                        : 'bg-[#FFD60A]/15 text-[#FFD60A]'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#A3A3A3]">
                  <span>Track Category:</span>
                  <span className="text-[#F5F5F5] font-semibold">{result.category}</span>
                </div>
                <div className="flex items-center justify-between text-[#A3A3A3]">
                  <span>Submitted on:</span>
                  <span className="text-[#F5F5F5]">{new Date(result.createdAt).toLocaleDateString()}</span>
                </div>
                {result.status !== 'Resolved' && (
                  <div className="flex items-center gap-1.5 text-[#FFD60A] pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated response: within 24 hours</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicTrackerPage;
