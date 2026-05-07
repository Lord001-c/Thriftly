import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CheckCircle, Phone, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';

const ADMIN_EMAIL = 'one431346@gmail.com';

interface PayoutRow {
  order_id: string;
  listing_title: string;
  seller_payout: number;
  amount: number;
  created_at: string;
  payout_status: string;
  seller_name: string;
  seller_momo: string;
  seller_momo_provider: string;
}

export default function AdminPayoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<Set<string>>(new Set());

  const isAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (isAdmin) fetchPayouts();
  }, [isAdmin]);

  async function fetchPayouts() {
    setLoading(true);

    // Fetch all pending orders
    const { data: ordersRaw } = await supabase
      .from('orders')
      .select('id, amount, seller_payout, payout_status, created_at, listing_id, seller_id, buyer_id')
      .eq('payout_status', 'pending')
      .in('status', ['paid', 'shipped', 'delivered'])
      .order('created_at', { ascending: true });

    if (!ordersRaw || ordersRaw.length === 0) { setRows([]); setLoading(false); return; }

    // Fetch listing titles
    const listingIds = [...new Set(ordersRaw.map((o: any) => o.listing_id).filter(Boolean))];
    const { data: listingsRaw } = await supabase
      .from('listings').select('id, title').in('id', listingIds);
    const listingMap = new Map((listingsRaw || []).map((l: any) => [l.id, l.title]));

    // Fetch seller user_ids from seller_profiles
    const sellerIds = [...new Set(ordersRaw.map((o: any) => o.seller_id).filter(Boolean))];
    const { data: spRaw } = await supabase
      .from('seller_profiles').select('seller_id, user_id').in('seller_id', sellerIds);
    const sellerUserMap = new Map((spRaw || []).map((s: any) => [s.seller_id, s.user_id]));

    // Fetch seller profiles (momo, name)
    const userIds = [...new Set((spRaw || []).map((s: any) => s.user_id).filter(Boolean))];
    const { data: profilesRaw } = await supabase
      .from('profiles').select('id, full_name, momo_name, momo_number, momo_provider').in('id', userIds);
    const profileMap = new Map((profilesRaw || []).map((p: any) => [p.id, p]));

    setRows(ordersRaw.map((o: any) => {
      const userId = sellerUserMap.get(o.seller_id);
      const profile = profileMap.get(userId) || {};
      return {
        order_id: o.id,
        listing_title: listingMap.get(o.listing_id) || 'Unknown item',
        seller_payout: Number(o.seller_payout ?? o.amount * 0.85),
        amount: Number(o.amount),
        created_at: o.created_at,
        payout_status: o.payout_status ?? 'pending',
        seller_name: (profile as any).momo_name || (profile as any).full_name || 'Unknown seller',
        seller_momo: (profile as any).momo_number || '—',
        seller_momo_provider: (profile as any).momo_provider || '',
      };
    }));

    setLoading(false);
  }

  async function markPaid(orderId: string) {
    setMarking(prev => new Set(prev).add(orderId));
    await supabase.from('orders').update({ payout_status: 'paid' }).eq('id', orderId);
    setRows(prev => prev.filter(r => r.order_id !== orderId));
    setMarking(prev => { const s = new Set(prev); s.delete(orderId); return s; });
  }

  if (authLoading || (!user && !authLoading === false)) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-black animate-spin" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400 text-sm">Access denied. Logged in as: {user.email}</p>
      </div>
    );
  }

  const totalOwed = rows.reduce((s, r) => s + r.seller_payout, 0);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-bold text-zinc-950">Payout Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Pending seller payouts — process daily at midnight</p>
        </div>

        {/* Total owed */}
        <div className="bg-zinc-950 text-white rounded-[24px] p-6 mb-8">
          <p className="text-sm text-zinc-400 mb-1">Total owed to sellers</p>
          <p className="text-4xl font-bold">GHS {totalOwed.toFixed(2)}</p>
          <p className="text-xs text-zinc-500 mt-2">{rows.length} pending {rows.length === 1 ? 'order' : 'orders'}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-zinc-100 p-5">
                <div className="shimmer h-4 w-1/2 rounded-full mb-2" />
                <div className="shimmer h-3 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-zinc-100 p-12 text-center">
            <CheckCircle size={32} className="text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">All caught up — no pending payouts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(row => (
              <div key={row.order_id} className="bg-white rounded-[20px] border border-zinc-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-950 truncate mb-1">{row.listing_title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-0.5">
                      <User size={11} />
                      <span>{row.seller_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                      <Phone size={11} />
                      <span>{row.seller_momo_provider && `${row.seller_momo_provider} · `}{row.seller_momo}</span>
                    </div>
                    <p className="text-[10px] text-zinc-300 mt-1">{fmt(row.created_at)} · Order #{row.order_id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-zinc-950">GHS {row.seller_payout.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-400 mb-3">of GHS {row.amount.toFixed(2)} sale</p>
                    <button
                      onClick={() => markPaid(row.order_id)}
                      disabled={marking.has(row.order_id)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <CheckCircle size={12} />
                      {marking.has(row.order_id) ? 'Marking...' : 'Mark as paid'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
