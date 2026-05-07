import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, Plus, Clock, ArrowRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

interface Stats {
  earnedThisMonth: number;
  activeListings: number;
  pendingOrders: number;
  totalSales: number;
}

interface RecentOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listing: { title: string; category: string; image_clean: string };
  buyerName: string;
}

interface RecentListing {
  id: string;
  title: string;
  price: number;
  category: string;
  image_height: number;
  status: string;
}

interface RawOrderAmount {
  amount: number;
}

interface RawRecentOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listing: { title: string; category: string; image_clean: string } | null;
  buyer: { id: string } | null;
}

interface BuyerProfile {
  id: string;
  full_name: string | null;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-zinc-900 text-white',
  delivered: 'bg-zinc-100 text-zinc-600',
  cancelled: 'bg-zinc-200 text-zinc-400',
  active: 'bg-zinc-900 text-white',
  sold: 'bg-zinc-400 text-white',
  paused: 'bg-zinc-200 text-zinc-600',
};

function StatCard({ icon: Icon, label, value, sub, loading }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-zinc-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
          <Icon size={18} className="text-zinc-500" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      {loading ? (
        <div className="shimmer h-7 w-24 rounded-full" />
      ) : (
        <>
          <p className="text-2xl font-bold text-zinc-950">{value}</p>
          {sub && <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ earnedThisMonth: 0, activeListings: 0, pendingOrders: 0, totalSales: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const isSeller = profile?.role === 'seller';

  useEffect(() => {
    if (!authLoading && user && isSeller) fetchDashboard();
  }, [user, authLoading, isSeller]);

  useEffect(() => {
    if (!sellerId) return;

    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `seller_id=eq.${sellerId}` },
        (payload: any) => {
          if (payload.new.status === 'delivered') {
            setRecentOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: 'delivered' } : o));
            const msg = `Order #${String(payload.new.id).slice(0, 8)} confirmed delivered!`;
            setToast(msg);
            setTimeout(() => setToast(null), 4000);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sellerId]);

  async function fetchDashboard() {
    setLoading(true);

    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!sp) { setLoading(false); return; }
    const sid = sp.seller_id;
    setSellerId(sid);

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const [ordersRes, activeRes, pendingRes, totalRes, listingsRes, recentOrdersRes] = await Promise.all([
      supabase.from('orders').select('amount').eq('seller_id', sid).eq('status', 'paid').gte('created_at', monthStart),
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', sid).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', sid).eq('status', 'paid'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('seller_id', sid),
      supabase.from('listings').select('id, title, price, category, image_clean, image_height, status').eq('seller_id', sid).order('created_at', { ascending: false }).limit(4),
      supabase.from('orders').select('id, amount, status, created_at, listing:listing_id(title, category, image_clean), buyer:buyer_id(id)').eq('seller_id', sid).order('created_at', { ascending: false }),
    ]);

    const earned = ((ordersRes.data || []) as RawOrderAmount[]).reduce(
      (sum, o) => sum + Number(o.amount) * 0.85,
      0
    );

    const rawOrders = (recentOrdersRes.data || []) as RawRecentOrder[];
    const buyerIds = [...new Set(rawOrders.map((d) => d.buyer?.id).filter((id): id is string => Boolean(id)))];
    const { data: buyerProfilesData } = await supabase.from('profiles').select('id, full_name').in('id', buyerIds);
    const profileMap = new Map(((buyerProfilesData || []) as BuyerProfile[]).map((p) => [p.id, p.full_name]));

    setStats({
      earnedThisMonth: earned,
      activeListings: activeRes.count || 0,
      pendingOrders: pendingRes.count || 0,
      totalSales: totalRes.count || 0,
    });

    setRecentListings((listingsRes.data || []).map((l) => ({ ...l, status: (l as RecentListing).status || 'active' })));
    setRecentOrders(rawOrders.map((d) => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      created_at: d.created_at,
      listing: d.listing || { title: 'Unknown', category: 'Tops', image_clean: '' },
      buyerName: profileMap.get(d.buyer?.id ?? '') || 'Buyer',
    })));

    setLoading(false);
  }

  async function markDelivered(orderId: string) {
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    setRecentOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' } : o))
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-black animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to="/" replace />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] || 'Seller';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-5 py-3 bg-zinc-950 text-white text-sm font-medium rounded-full shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Greeting bar */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{today}</p>
        </div>
        <Link
          to="/sell"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New listing</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={DollarSign}
          label="Earned this month"
          value={`GHS ${stats.earnedThisMonth.toFixed(2)}`}
          sub="after 15% fee"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Active listings"
          value={stats.activeListings.toString()}
          loading={loading}
        />
        <StatCard
          icon={Clock}
          label="Pending orders"
          value={stats.pendingOrders.toString()}
          loading={loading}
        />
        <StatCard
          icon={ShoppingBag}
          label="Total sales"
          value={stats.totalSales.toString()}
          loading={loading}
        />
      </div>

      {/* Two column section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Recent Orders - 60% */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-950">Recent Orders</h2>
            <Link to="/seller/orders" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-[20px] border border-zinc-100 p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="shimmer w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-3 w-3/4 rounded-full" />
                    <div className="shimmer h-3 w-1/3 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-zinc-100 p-8 text-center">
              <p className="text-sm text-zinc-400">No orders yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-[20px] border border-zinc-100 divide-y divide-zinc-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                    <img
                      src={order.listing.image_clean || PRODUCT_IMAGES[order.listing.category] || PRODUCT_IMAGES.Tops}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-950 truncate">{order.listing.title}</p>
                    <p className="text-xs text-zinc-400">by {order.buyerName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-950">GHS {(Number(order.amount) * 0.85).toFixed(2)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_STYLES[order.status] || 'bg-zinc-100 text-zinc-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  {order.status === 'paid' && (
                    <button
                      onClick={() => markDelivered(order.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-200 shrink-0"
                    >
                      Deliver
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings - 40% */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-950">Your Listings</h2>
            <Link to="/seller/listings" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[16px] border border-zinc-100 overflow-hidden">
                  <div className="shimmer h-32" />
                  <div className="p-3 space-y-2">
                    <div className="shimmer h-3 w-3/4 rounded-full" />
                    <div className="shimmer h-3 w-1/2 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentListings.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-zinc-100 p-8 text-center">
              <p className="text-sm text-zinc-400 mb-3">No listings yet</p>
              <Link
                to="/sell"
                className="inline-block px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
              >
                New listing +
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listing/${listing.id}`}
                  className="bg-white rounded-[16px] border border-zinc-100 overflow-hidden hover:border-zinc-200 transition-all duration-200"
                >
                  <div className="h-32 overflow-hidden bg-zinc-50">
                    <img
                      src={(listing as any).image_clean || PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-zinc-950 truncate">{listing.title}</p>
                    <p className="text-xs font-bold text-black mt-0.5">GHS {Number(listing.price).toFixed(2)}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-medium capitalize ${STATUS_STYLES[listing.status] || 'bg-zinc-100 text-zinc-600'}`}>
                      {listing.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/sell"
          className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
        >
          <Plus size={16} />
          New listing
        </Link>
        <Link
          to="/seller/orders"
          className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-white text-zinc-700 text-sm font-medium border border-zinc-200 hover:border-zinc-300 transition-all duration-200"
        >
          <ShoppingBag size={16} />
          All orders
        </Link>
        <Link
          to="/seller/payouts"
          className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-white text-zinc-700 text-sm font-medium border border-zinc-200 hover:border-zinc-300 transition-all duration-200"
        >
          <DollarSign size={16} />
          Payouts
        </Link>
        <Link
          to="/seller/profile"
          className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-white text-zinc-700 text-sm font-medium border border-zinc-200 hover:border-zinc-300 transition-all duration-200"
        >
          Profile
        </Link>
      </div>
    </div>
  );
}
