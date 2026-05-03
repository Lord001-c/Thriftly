import { Search, ShoppingBag, Heart, Plus, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const role = profile?.role || 'buyer';
  const isLoggedIn = !!user;
  const isSeller = isLoggedIn && role === 'seller';

  const avatarContent = profile?.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={profile.full_name || 'User'}
      className="w-8 h-8 rounded-full object-cover"
    />
  ) : (
    <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-900">
      {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 bg-[#FAFAFA]/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left — Wordmark */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-950 hidden sm:block">
              Thriftly
            </span>
          </Link>

          {/* Center — Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 sm:mx-8">
            <div
              className={`flex items-center gap-2 bg-white border rounded-full px-4 py-2 transition-all duration-200 ease-out ${
                searchFocused
                  ? 'border-zinc-300 shadow-sm scale-[1.02]'
                  : 'border-zinc-200'
              }`}
            >
              <Search size={16} className="text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 outline-none"
              />
            </div>
          </form>

          {/* Right — Dynamic based on auth state & role */}
          <div className="flex items-center gap-1.5 shrink-0 transition-all duration-200">
            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-all duration-200"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-full text-sm font-medium text-white bg-black hover:bg-zinc-800 transition-colors duration-200"
                >
                  Register
                </Link>
              </>
            )}

            {isLoggedIn && !isSeller && (
              <>
                <Link
                  to="/wishlist"
                  className="p-2.5 rounded-full hover:bg-zinc-100 transition-colors duration-200"
                >
                  <Heart size={20} className="text-zinc-700" />
                </Link>
                <Link
                  to="/orders"
                  className="p-2.5 rounded-full hover:bg-zinc-100 transition-colors duration-200"
                >
                  <ShoppingBag size={20} className="text-zinc-700" />
                </Link>
                <Link to="/profile" className="ml-0.5">
                  {avatarContent}
                </Link>
              </>
            )}

            {isLoggedIn && isSeller && (
              <>
                <Link
                  to="/sell"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-black hover:bg-zinc-800 transition-colors duration-200"
                >
                  <Plus size={14} />
                  New listing
                </Link>
                <Link
                  to="/seller/dashboard"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-all duration-200"
                >
                  <LayoutDashboard size={14} />
                  Dashboard
                </Link>
                <Link to="/profile" className="ml-0.5">
                  {avatarContent}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
