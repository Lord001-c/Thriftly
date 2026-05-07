import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Package, ShoppingBag, Settings } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/login');
  };

  const isSeller = profile?.role === 'seller';

  return (
    <>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Profile header */}
        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8 mb-4">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'User'}
                className="w-16 h-16 rounded-full object-cover border border-zinc-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-semibold text-zinc-900">
                {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-zinc-950 truncate">
                {profile?.full_name || 'User'}
              </h1>
              <p className="text-sm text-zinc-400 truncate">{user?.email}</p>
              <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 capitalize">
                {profile?.role || 'buyer'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="bg-white rounded-[24px] border border-zinc-100 overflow-hidden mb-4">
          <Link
            to="/orders"
            className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-50 transition-colors duration-150 border-b border-zinc-50"
          >
            <ShoppingBag size={18} className="text-zinc-400" />
            <span className="flex-1 text-sm font-medium text-zinc-950">My Orders</span>
            <span className="text-xs text-zinc-400">View</span>
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-50 transition-colors duration-150 border-b border-zinc-50"
          >
            <Package size={18} className="text-zinc-400" />
            <span className="flex-1 text-sm font-medium text-zinc-950">Wishlist</span>
            <span className="text-xs text-zinc-400">View</span>
          </Link>

          {isSeller && (
            <Link
              to="/seller/dashboard"
              className="flex items-center gap-3 px-6 py-4 hover:bg-zinc-50 transition-colors duration-150 border-b border-zinc-50"
            >
              <Settings size={18} className="text-zinc-400" />
              <span className="flex-1 text-sm font-medium text-zinc-950">Seller Dashboard</span>
              <span className="text-xs text-zinc-400">View</span>
            </Link>
          )}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full flex items-center justify-center gap-2 bg-white rounded-[20px] border border-zinc-100 px-6 py-4 text-sm font-medium text-zinc-500 hover:text-zinc-950 hover:border-zinc-200 transition-all duration-200"
        >
          <LogOut size={16} />
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
      </div>
    </>
  );
}
