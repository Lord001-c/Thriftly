import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

type Role = 'buyer' | 'seller';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('buyer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const navigate = useNavigate();

  const allAccepted = isAdult && agreedToTerms && agreedToPrivacy;
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: selectedRole,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .update({ role: selectedRole, full_name: fullName })
        .eq('id', userId);

      if (selectedRole === 'seller') {
        const { data: newSeller } = await supabase
          .from('sellers')
          .insert({ name: fullName })
          .select('id')
          .maybeSingle();

        if (newSeller) {
          await supabase
            .from('seller_profiles')
            .insert({ user_id: userId, seller_id: newSeller.id });
        }
      }
    }

    // Fire signup notification (fire-and-forget)
    supabase.functions.invoke('notify-admin', {
      body: { type: 'signup', name: fullName, email, role: selectedRole },
    }).catch(() => {})

    if (selectedRole === 'seller') {
      navigate('/seller/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">Create your account</h1>
          <p className="text-sm text-zinc-400 mt-1">Join the Thriftly community</p>
        </div>

        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          {/* Role selection cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('buyer')}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-200 ease-out ${
                selectedRole === 'buyer'
                  ? 'bg-black text-white border-black'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <ShoppingBag
                size={28}
                className={`transition-colors duration-200 ${
                  selectedRole === 'buyer' ? 'text-white' : 'text-zinc-500'
                }`}
              />
              <span className="text-sm font-bold">I'm a Buyer</span>
              <span
                className={`text-xs leading-tight transition-colors duration-200 ${
                  selectedRole === 'buyer' ? 'text-zinc-300' : 'text-zinc-400'
                }`}
              >
                Shop unique second-hand finds
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('seller')}
              className={`flex flex-col items-center gap-2.5 p-5 rounded-2xl border transition-all duration-200 ease-out ${
                selectedRole === 'seller'
                  ? 'bg-black text-white border-black'
                  : 'bg-zinc-100 text-zinc-700 border-zinc-100 hover:border-zinc-200'
              }`}
            >
              <Tag
                size={28}
                className={`transition-colors duration-200 ${
                  selectedRole === 'seller' ? 'text-white' : 'text-zinc-500'
                }`}
              />
              <span className="text-sm font-bold">I'm a Seller</span>
              <span
                className={`text-xs leading-tight transition-colors duration-200 ${
                  selectedRole === 'seller' ? 'text-zinc-300' : 'text-zinc-400'
                }`}
              >
                Sell your second-hand items
              </span>
            </button>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-zinc-500 bg-zinc-100 rounded-full px-4 py-2 text-center">
                {error}
              </p>
            )}

            {/* Acceptance checkboxes */}
            <div className="space-y-3 pt-1">
              {/* Checkbox 1 — Age */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsAdult(v => !v)}
                  className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
                    isAdult ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
                  }`}
                >
                  {isAdult && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-zinc-600 leading-relaxed">I am at least 18 years old</span>
              </label>

              {/* Checkbox 2 — Terms */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setAgreedToTerms(v => !v)}
                  className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
                    agreedToTerms ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
                  }`}
                >
                  {agreedToTerms && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-zinc-600 leading-relaxed">
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
                <div
                  onClick={() => setAgreedToPrivacy(v => !v)}
                  className={`mt-0.5 w-4 h-4 rounded-md shrink-0 flex items-center justify-center border transition-all duration-200 ${
                    agreedToPrivacy ? 'bg-black border-black' : 'bg-zinc-200 border-zinc-200'
                  }`}
                >
                  {agreedToPrivacy && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-zinc-600 leading-relaxed">
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
            </div>

            <button
              type="submit"
              disabled={loading || !allAccepted}
              className={`w-full py-3.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                allAccepted && !loading
                  ? 'bg-black text-white hover:bg-zinc-800 cursor-pointer'
                  : 'bg-zinc-300 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-zinc-950 font-medium hover:text-zinc-700 transition-colors">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
