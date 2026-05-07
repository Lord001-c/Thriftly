import { useState, useEffect } from 'react';
import { Wallet, Clock, CheckCircle, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

type MomoProvider = 'MTN' | 'Telecel' | 'AirtelTigo';

interface PayoutOrder {
  id: string;
  amount: number;
  seller_payout: number;
  payout_status: string;
  created_at: string;
  listing_title: string;
}

interface MomoDetails {
  momo_name: string;
  momo_number: string;
  momo_provider: MomoProvider;
}

export default function SellerPayoutsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PayoutOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // MoMo setup
  const [momo, setMomo] = useState<MomoDetails>({ momo_name: '', momo_number: '', momo_provider: 'MTN' });
  const [momoSaved, setMomoSaved] = useState(false);
  const [momoSaving, setMomoSaving] = useState(false);
  const [momoExists, setMomoExists] = useState(false);

  const providers: MomoProvider[] = ['MTN', 'Telecel', 'AirtelTigo'];

  useEffect(() => {
    if (user) { fetchMomo(); fetchPayouts(); }
  }, [user]);

  async function fetchMomo() {
    const { data } = await supabase
      .from('profiles')
      .select('momo_name, momo_number, momo_provider')
      .eq('id', user!.id)
      .maybeSingle();

    if (data?.momo_number) {
      setMomo({
        momo_name: data.momo_name || '',
        momo_number: data.momo_number,
        momo_provider: (data.momo_provider || 'MTN') as MomoProvider,
      });
      setMomoExists(true);
    }
  }

  async function saveMomo() {
    if (!momo.momo_name.trim() || !momo.momo_number.trim()) return;
    setMomoSaving(true);
    await supabase.from('profiles').update({
      momo_name: momo.momo_name.trim(),
      momo_number: momo.momo_number.trim(),
      momo_provider: momo.momo_provider,
    }).eq('id', user!.id);
    setMomoExists(true);
    setMomoSaved(true);
    setMomoSaving(false);
    setTimeout(() => setMomoSaved(false), 3000);
  }

  async function fetchPayouts() {
    setLoading(true);
    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!sp) { setLoading(false); return; }

    const { data: ordersRaw } = await supabase
      .from('orders')
      .select('id, amount, seller_payout, payout_status, created_at, listing_id')
      .eq('seller_id', sp.seller_id)
      .in('status', ['paid', 'shipped', 'delivered'])
      .order('created_at', { ascending: false });

    if (!ordersRaw || ordersRaw.length === 0) { setOrders([]); setLoading(false); return; }

    const listingIds = [...new Set(ordersRaw.map((o: any) => o.listing_id).filter(Boolean))];
    const { data: listingsRaw } = await supabase
      .from('listings').select('id, title').in('id', listingIds);
    const listingMap = new Map((listingsRaw || []).map((l: any) => [l.id, l.title]));

    setOrders(ordersRaw.map((o: any) => ({
      id: o.id,
      amount: Number(o.amount),
      seller_payout: Number(o.seller_payout ?? o.amount * 0.85),
      payout_status: o.payout_status ?? 'pending',
      created_at: o.created_at,
      listing_title: listingMap.get(o.listing_id) || 'Unknown item',
    })));
    setLoading(false);
  }

  const pending = orders.filter(o => o.payout_status === 'pending');
  const paid = orders.filter(o => o.payout_status === 'paid');
  const totalPending = pending.reduce((s, o) => s + o.seller_payout, 0);
  const totalPaid = paid.reduce((s, o) => s + o.seller_payout, 0);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-950">Earnings</h1>
        <p className="text-sm text-zinc-400 mt-1">Your payouts from sales</p>
      </div>

      {/* MoMo setup */}
      <div className="bg-white rounded-[24px] border border-zinc-100 p-5 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={16} className="text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-950">
            {momoExists ? 'Payout account' : 'Set up payout account'}
          </h2>
          {momoExists && !momoSaved && (
            <span className="ml-auto text-xs text-zinc-400 cursor-pointer underline underline-offset-2" onClick={() => setMomoExists(false)}>
              Edit
            </span>
          )}
        </div>

        {momoExists && !momoSaved ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-950">{momo.momo_name}</p>
            <p className="text-xs text-zinc-500">{momo.momo_provider} · {momo.momo_number}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">Name on MoMo account</label>
              <input
                type="text"
                value={momo.momo_name}
                onChange={e => setMomo(p => ({ ...p, momo_name: e.target.value }))}
                placeholder="e.g. Kwame Mensah"
                className="w-full px-4 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-1.5 block">MoMo number</label>
              <input
                type="tel"
                value={momo.momo_number}
                onChange={e => setMomo(p => ({ ...p, momo_number: e.target.value }))}
                placeholder="e.g. 0241234567"
                className="w-full px-4 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 mb-2 block">Provider</label>
              <div className="flex gap-2 flex-wrap">
                {providers.map(p => (
                  <button
                    key={p}
                    onClick={() => setMomo(prev => ({ ...prev, momo_provider: p }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      momo.momo_provider === p
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={saveMomo}
              disabled={momoSaving || !momo.momo_name.trim() || !momo.momo_number.trim()}
              className="w-full py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {momoSaved ? <><Check size={15} /> Saved</> : momoSaving ? 'Saving...' : 'Save payout details'}
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-[20px] border border-zinc-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <Clock size={15} className="text-zinc-500" />
            </div>
            <span className="text-xs text-zinc-400">Pending payout</span>
          </div>
          {loading ? <div className="shimmer h-7 w-24 rounded-full" /> : (
            <p className="text-2xl font-bold text-zinc-950">GHS {totalPending.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-white rounded-[20px] border border-zinc-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
              <CheckCircle size={15} className="text-zinc-500" />
            </div>
            <span className="text-xs text-zinc-400">Total paid out</span>
          </div>
          {loading ? <div className="shimmer h-7 w-24 rounded-full" /> : (
            <p className="text-2xl font-bold text-zinc-950">GHS {totalPaid.toFixed(2)}</p>
          )}
        </div>
      </div>

      {/* Pending orders */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-zinc-950 mb-3">Pending payouts</h2>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[16px] border border-zinc-100 p-4">
                <div className="shimmer h-4 w-2/3 rounded-full mb-2" />
                <div className="shimmer h-3 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-zinc-100 p-8 text-center">
            <Wallet size={24} className="text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No pending payouts</p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
            {pending.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-950 truncate">{order.listing_title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{fmt(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-zinc-950">GHS {order.seller_payout.toFixed(2)}</p>
                  <span className="text-[10px] text-zinc-400">85% of GHS {order.amount.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-[16px] bg-zinc-50 border border-zinc-100">
        <p className="text-xs text-zinc-400 leading-relaxed">
          Payouts are processed daily at midnight. You receive 85% of each sale price sent to your MoMo number.
        </p>
      </div>

      {paid.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-zinc-950 mb-3">Paid out</h2>
          <div className="bg-white rounded-[20px] border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
            {paid.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-950 truncate">{order.listing_title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{fmt(order.created_at)}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-zinc-600">GHS {order.seller_payout.toFixed(2)}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400">
                    <CheckCircle size={9} /> Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
