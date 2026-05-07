import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface Order {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  dispatched_at: string | null;
  delivered_at: string | null;
  seller_id: string;
  buyer_id: string;
  listing: { title: string; image_clean: string } | null;
  buyer: { full_name: string } | null;
}

function ProgressBar({ status }: { status: string }) {
  const step = status === 'paid' ? 0 : status === 'shipped' ? 1 : 2;
  const labels = ['Order Placed', 'Dispatched', 'Delivered'];

  return (
    <div className="flex items-start w-full mb-6">
      {labels.map((label, i) => (
        <div key={i} className="flex flex-1 items-start last:flex-none last:w-auto">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
              i < step ? 'bg-black' : i === step ? 'bg-black animate-pulse' : 'bg-zinc-200'
            }`} />
            <span className="text-[10px] text-zinc-400 mt-1.5 text-center leading-tight whitespace-nowrap">
              {label}{i < step ? ' ✓' : ''}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`flex-1 h-0.5 mt-2 mx-1.5 transition-all duration-500 ${i < step ? 'bg-black' : 'bg-zinc-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ConfirmDeliveryPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [sellerUserId, setSellerUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionDone, setActionDone] = useState('');

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload: any) => setOrder(prev => prev ? { ...prev, ...payload.new } : prev)
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId]);

  async function fetchOrder() {
    // Step 1: fetch order without any joins (avoids auth.users join crash)
    const { data: orderRaw, error } = await supabase
      .from('orders')
      .select('id, status, amount, created_at, seller_id, buyer_id, listing_id, dispatched_at, delivered_at')
      .eq('id', orderId!)
      .maybeSingle();

    if (error || !orderRaw) {
      // Try without dispatch columns in case migration wasn't applied
      const { data: orderBasic } = await supabase
        .from('orders')
        .select('id, status, amount, created_at, seller_id, buyer_id, listing_id')
        .eq('id', orderId!)
        .maybeSingle();

      if (!orderBasic) { setLoading(false); return; }
      await hydrateOrder(orderBasic as any);
      return;
    }

    await hydrateOrder(orderRaw as any);
  }

  async function hydrateOrder(orderRaw: any) {
    // Step 2: fetch listing separately
    const { data: listing } = orderRaw.listing_id
      ? await supabase.from('listings').select('title, image_clean').eq('id', orderRaw.listing_id).maybeSingle()
      : { data: null };

    // Step 3: fetch buyer name from profiles (not auth.users)
    const { data: buyerProfile } = orderRaw.buyer_id
      ? await supabase.from('profiles').select('full_name').eq('id', orderRaw.buyer_id).maybeSingle()
      : { data: null };

    setOrder({
      ...orderRaw,
      listing: listing || null,
      buyer: buyerProfile ? { full_name: (buyerProfile as any).full_name } : null,
    });

    // Step 4: get seller's user_id
    if (orderRaw.seller_id) {
      const { data: sp } = await supabase
        .from('seller_profiles')
        .select('user_id')
        .eq('seller_id', orderRaw.seller_id)
        .maybeSingle();
      setSellerUserId((sp as any)?.user_id || null);
    }

    setLoading(false);
  }

  async function markDispatched() {
    if (!user || !orderId) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    setActionLoading(false);
    setActionDone('dispatched');
  }

  async function confirmDelivery() {
    if (!user || !orderId) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
    setActionLoading(false);
    setActionDone('delivered');
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtdt = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-black animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl font-bold text-zinc-950 mb-4 tracking-tight">Thriftly</p>
          <p className="text-zinc-400 text-sm">This order does not exist or has expired.</p>
        </div>
      </div>
    );
  }

  const isSeller = !!user && user.id === sellerUserId;
  const isBuyer = !!user && user.id === order.buyer_id;
  const isGuest = !user;
  const buyerFirstName = order.buyer?.full_name?.split(' ')[0] || 'the buyer';
  const { status } = order;

  /* ── DELIVERED STATE ── */
  if (status === 'delivered') {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <p className="text-center text-xl font-bold text-zinc-950 mb-8 tracking-tight">Thriftly</p>
          <div className="bg-white rounded-[28px] border border-zinc-100 p-6">
            <ProgressBar status="delivered" />

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-zinc-950 flex items-center justify-center mb-4">
                <CheckCircle size={30} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950">Delivery Complete</h2>
            </div>

            <div className="space-y-0 mb-6">
              <div className="flex justify-between text-xs py-2.5 border-b border-zinc-50">
                <span className="text-zinc-400">Order placed</span>
                <span className="text-zinc-700">{fmtdt(order.created_at)}</span>
              </div>
              {order.dispatched_at && (
                <div className="flex justify-between text-xs py-2.5 border-b border-zinc-50">
                  <span className="text-zinc-400">Dispatched</span>
                  <span className="text-zinc-700">{fmtdt(order.dispatched_at)}</span>
                </div>
              )}
              {order.delivered_at && (
                <div className="flex justify-between text-xs py-2.5">
                  <span className="text-zinc-400">Delivered</span>
                  <span className="text-zinc-700">{fmtdt(order.delivered_at)}</span>
                </div>
              )}
            </div>

            <Link
              to="/"
              className="block w-full py-3 rounded-full border border-zinc-200 text-zinc-600 text-sm font-medium text-center hover:border-zinc-300 transition-colors duration-200"
            >
              Continue shopping
            </Link>
          </div>
          <p className="text-xs text-zinc-300 italic text-center mt-6">Packed with love from Kantamanto · Thriftly.com</p>
        </div>
      </div>
    );
  }

  /* ── PAID / SHIPPED STATES ── */
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="text-center text-xl font-bold text-zinc-950 mb-8 tracking-tight">Thriftly</p>

        <div className="bg-white rounded-[28px] border border-zinc-100 p-6">
          <ProgressBar status={status} />

          {/* Product summary */}
          <div className="flex flex-col items-center text-center mb-6 pb-5 border-b border-zinc-50">
            {order.listing?.image_clean && (
              <div className="w-[100px] h-[100px] rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden mb-3">
                <img src={order.listing.image_clean} alt={order.listing.title} className="w-full h-full object-cover" />
              </div>
            )}
            <h2 className="text-base font-bold text-zinc-950 mb-0.5">{order.listing?.title || 'Unknown item'}</h2>
            <p className="text-xs text-zinc-500 mb-1">Ordered by {buyerFirstName}</p>
            <p className="text-lg font-bold text-zinc-950">GHS {Number(order.amount).toFixed(2)}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{fmt(order.created_at)}</p>
          </div>

          {/* PAID — not dispatched yet */}
          {status === 'paid' && (
            <div>
              {isGuest && (
                <div className="text-center">
                  <p className="text-xs text-zinc-400 mb-3">Sign in to see your order status</p>
                  <Link to="/login" className="block w-full py-3 rounded-full bg-black text-white text-sm font-semibold text-center hover:bg-zinc-800 transition-colors duration-200">
                    Sign in to continue
                  </Link>
                </div>
              )}
              {isSeller && (
                actionDone === 'dispatched' ? (
                  <p className="text-sm text-center text-zinc-500 font-medium py-2">Dispatched ✓ Buyer will be notified</p>
                ) : (
                  <button
                    onClick={markDispatched}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {actionLoading ? 'Dispatching...' : 'Mark as dispatched'}
                  </button>
                )
              )}
              {isBuyer && (
                <p className="text-xs text-zinc-400 text-center py-2">Your item hasn't been dispatched yet. Check back soon.</p>
              )}
            </div>
          )}

          {/* SHIPPED — dispatched, awaiting buyer */}
          {status === 'shipped' && (
            <div>
              {order.dispatched_at && (
                <p className="text-xs text-zinc-400 text-center mb-4">
                  Dispatched on {fmtdt(order.dispatched_at)}
                </p>
              )}
              {isGuest && (
                <Link to="/login" className="block w-full py-3 rounded-full bg-black text-white text-sm font-semibold text-center hover:bg-zinc-800 transition-colors duration-200">
                  Sign in to continue
                </Link>
              )}
              {isSeller && (
                <p className="text-xs text-zinc-400 text-center py-2">Awaiting buyer confirmation</p>
              )}
              {isBuyer && (
                actionDone === 'delivered' ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-950 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={22} className="text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-950 mb-1">Delivery confirmed!</h3>
                    <p className="text-sm text-zinc-500 mb-4">Thank you for shopping on Thriftly</p>
                    <Link to="/" className="block w-full py-3 rounded-full bg-black text-white text-sm font-semibold text-center hover:bg-zinc-800 transition-colors duration-200">
                      Continue shopping
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-bold text-zinc-950 text-center mb-4">Your item is on its way!</p>
                    <button
                      onClick={confirmDelivery}
                      disabled={actionLoading}
                      className="w-full py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200 mb-2"
                    >
                      {actionLoading ? 'Confirming...' : 'Confirm I received this item'}
                    </button>
                    <p className="text-xs text-zinc-400 text-center">Only tap if you have physically received the package</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-300 italic text-center mt-6">Packed with love from Kantamanto · Thriftly.com</p>
      </div>
    </div>
  );
}
