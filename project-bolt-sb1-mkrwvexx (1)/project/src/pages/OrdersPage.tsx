import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  listing_id: string;
  listing_title: string;
  listing_category: string;
  listing_image: string;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

const STATUS_LABEL: Record<string, string> = {
  paid: 'Order placed',
  shipped: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-zinc-900 text-white',
  shipped: 'bg-blue-600 text-white',
  delivered: 'bg-zinc-600 text-white',
  cancelled: 'bg-zinc-300 text-zinc-500',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  // Real-time: update order status when seller dispatches
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('buyer-orders-rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload: any) => {
        setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, status: payload.new.status } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, listing_id')
      .eq('buyer_id', user!.id)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const listingIds = [...new Set(data.map((o: any) => o.listing_id).filter(Boolean))];
    const { data: listingsRaw } = await supabase
      .from('listings')
      .select('id, title, category, image_clean')
      .in('id', listingIds);

    const listingMap = new Map((listingsRaw || []).map((l: any) => [l.id, l]));

    setOrders(data.map((o: any) => ({
      id: o.id,
      amount: o.amount,
      status: o.status,
      created_at: o.created_at,
      listing_id: o.listing_id,
      listing_title: listingMap.get(o.listing_id)?.title || 'Unknown item',
      listing_category: listingMap.get(o.listing_id)?.category || 'Tops',
      listing_image: listingMap.get(o.listing_id)?.image_clean || '',
    })));
    setLoading(false);
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 mb-2">My Orders</h1>
        <p className="text-sm text-zinc-400 mb-6">Track your purchases</p>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-zinc-100 p-4">
                <div className="flex items-center gap-4">
                  <div className="shimmer w-16 h-16 rounded-[14px]" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-4 w-3/4 rounded-full" />
                    <div className="shimmer h-3 w-1/3 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 text-sm mb-1">No orders yet</p>
            <p className="text-zinc-400 text-xs mb-6">Your purchases will appear here</p>
            <Link
              to="/"
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-[20px] border border-zinc-100 overflow-hidden">
                <Link
                  to={`/orders/${order.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-zinc-50 transition-all duration-200 group"
                >
                  <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-zinc-100 shrink-0">
                    <img
                      src={order.listing_image || PRODUCT_IMAGES[order.listing_category] || PRODUCT_IMAGES.Tops}
                      alt={order.listing_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-950 truncate group-hover:text-zinc-700 transition-colors">
                      {order.listing_title}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-950">GHS {Number(order.amount).toFixed(2)}</p>
                    <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[order.status] || 'bg-zinc-100 text-zinc-600'}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                </Link>

                {/* Dispatched banner — prompt buyer to confirm delivery */}
                {order.status === 'shipped' && (
                  <div className="flex items-center justify-between px-4 pb-4 gap-3">
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Truck size={13} />
                      <span>Your item is on its way!</span>
                    </div>
                    <Link
                      to={`/confirm/${order.id}`}
                      className="px-3 py-1.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                    >
                      Confirm delivery
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
