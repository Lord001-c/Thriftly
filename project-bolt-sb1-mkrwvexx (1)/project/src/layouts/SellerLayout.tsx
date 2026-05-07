import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Wallet, User, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const NAV_ITEMS = [
  { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/seller/listings', label: 'Listings', icon: Package },
  { to: '/seller/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/seller/payouts', label: 'Payouts', icon: Wallet },
  { to: '/seller/profile', label: 'Profile', icon: User },
];

export default function SellerLayout() {
  const { signOut, profile, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    if (user) fetchNewOrderCount();
  }, [user, location.pathname]);

  async function fetchNewOrderCount() {
    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!sp) return;

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sp.seller_id)
      .eq('status', 'paid');

    setNewOrderCount(count ?? 0);
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAFA]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-zinc-100 flex-col z-50">
        <div className="p-6 pb-2">
          <span className="text-xl font-bold text-zinc-950 tracking-tight">Thriftly</span>
          <p className="text-xs text-zinc-400 mt-0.5">Seller Hub</p>
        </div>

        <nav className="flex flex-col gap-1 px-4 flex-1 mt-4">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
                }`
              }
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {label === 'Orders' && newOrderCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {newOrderCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-900">
              {profile?.full_name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-950 truncate">{profile?.full_name || 'Seller'}</p>
              <p className="text-xs text-zinc-400">Seller</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 w-full transition-all duration-200"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-100 z-50 flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                isActive ? 'text-black' : 'text-zinc-400'
              }`
            }
          >
            <div className="relative">
              <Icon size={20} />
              {label === 'Orders' && newOrderCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {newOrderCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="md:ml-64 flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
