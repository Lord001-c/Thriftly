import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export default function AcceptTermsPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAdult, setIsAdult] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [loading, setLoading] = useState(false);

  const allAccepted = isAdult && agreedToTerms && agreedToPrivacy;
  const from = (location.state as any)?.from?.pathname || '/';

  async function handleAccept() {
    if (!allAccepted || !user) return;
    setLoading(true);
    await supabase
      .from('profiles')
      .update({ terms_accepted: true })
      .eq('id', user.id);
    await refreshProfile();
    navigate(from, { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">Before you continue</h1>
          <p className="text-sm text-zinc-400 mt-1">
            We've updated our Terms and Privacy Policy. Please review and accept them to continue using Thriftly.
          </p>
        </div>

        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8 space-y-5">
          {/* Checkbox 1 — Age */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAdult}
              onChange={e => setIsAdult(e.target.checked)}
              className="sr-only"
            />
            <div className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
              isAdult ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
            }`}>
              {isAdult && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-zinc-600 leading-relaxed">I am at least 18 years old</span>
          </label>

          {/* Checkbox 2 — Terms */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="sr-only"
            />
            <div className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
              agreedToTerms ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
            }`}>
              {agreedToTerms && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-zinc-600 leading-relaxed">
              I agree to the{' '}
              <Link
                to="/terms"
                target="_blank"
                onClick={e => e.stopPropagation()}
                className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors"
              >
                Terms and Conditions
              </Link>
            </span>
          </label>

          {/* Checkbox 3 — Privacy */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={e => setAgreedToPrivacy(e.target.checked)}
              className="sr-only"
            />
            <div className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
              agreedToPrivacy ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
            }`}>
              {agreedToPrivacy && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-zinc-600 leading-relaxed">
              I agree to the{' '}
              <Link
                to="/privacy"
                target="_blank"
                onClick={e => e.stopPropagation()}
                className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600 transition-colors"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!allAccepted || loading}
            className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              allAccepted && !loading
                ? 'bg-black text-white hover:bg-zinc-800 cursor-pointer'
                : 'bg-zinc-300 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Saving...' : 'Continue to Thriftly'}
          </button>
        </div>
      </div>
    </div>
  );
}
