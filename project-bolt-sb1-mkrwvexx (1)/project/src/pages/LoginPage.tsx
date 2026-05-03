import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-lg font-bold">T</span>
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">Welcome back</h1>
          <p className="text-sm text-zinc-400 mt-1">Sign in to your Thriftly account</p>
        </div>

        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-3 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors duration-200"
                placeholder="Your password"
              />
            </div>

            {error && (
              <p className="text-sm text-zinc-500 bg-zinc-100 rounded-full px-4 py-2 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-400 mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-zinc-950 font-medium hover:text-zinc-700 transition-colors">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
