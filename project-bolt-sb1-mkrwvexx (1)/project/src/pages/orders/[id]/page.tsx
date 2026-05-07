import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Truck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

interface OrderDetail {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  seller_id: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
    condition: string;
    size: string;
    category: string;
    description: string;
    image_clean: string;
  };
  seller_profile: {
    username: string;
    avatar_url: string;
    rating: number;
  } | null;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=800',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=800',
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) fetchOrder();
  }, [id, user]);

  // Real-time status updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-detail-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload: any) => {
        setOrder(prev => prev ? { ...prev, status: payload.new.status } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  async function fetchOrder() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, listing:listing_id(id, title, price, condition, size, category, description, image_clean), seller:seller_id(id, name, avatar, rating)')
      .eq('id', id!)
      .eq('buyer_id', user!.id)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setOrder({
        id: d.id,
        amount: d.amount,
        status: d.status,
        created_at: d.created_at,
        seller_id: d.seller?.id || null,
        listing: d.listing,
        seller_profile: d.seller
          ? {
              username: d.seller.name,
              avatar_url: d.seller.avatar,
              rating: d.seller.rating,
            }
          : null,
      });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="shimmer h-4 w-24 rounded-full mb-6" />
        <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
          <div className="flex gap-6">
            <div className="shimmer w-32 h-32 rounded-[20px] shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="shimmer h-3 w-20 rounded-full" />
              <div className="shimmer h-5 w-3/4 rounded-full" />
              <div className="shimmer h-6 w-1/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-zinc-400 text-sm">Order not found.</p>
      </div>
    );
  }

  const image = order.listing.image_clean || PRODUCT_IMAGES[order.listing.category] || PRODUCT_IMAGES.Tops;
  const shortId = order.id.slice(0, 5).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
      >
        <ArrowLeft size={16} />
        Orders
      </Link>

      <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8">
        <div className="flex gap-5 sm:gap-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[20px] overflow-hidden bg-zinc-100 shrink-0">
            <img
              src={image}
              alt={order.listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-zinc-400 mb-1">Order #{shortId}</p>
            <h1 className="text-lg sm:text-xl font-semibold text-zinc-950 leading-tight line-clamp-2">
              {order.listing.title}
            </h1>
            <p className="text-2xl font-bold text-zinc-950 mt-2">
              GHS {Number(order.amount).toFixed(2)}
            </p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[order.status] || 'bg-zinc-200 text-zinc-600'}`}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-100 my-6" />

        {order.seller_profile && (
          <>
            <div className="flex items-center gap-3">
              {order.seller_profile.avatar_url ? (
                <img
                  src={order.seller_profile.avatar_url}
                  alt={order.seller_profile.username}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-semibold text-zinc-900">
                  {order.seller_profile.username?.[0]?.toUpperCase() || 'S'}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-zinc-950">{order.seller_profile.username}</p>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-zinc-400 fill-zinc-400" />
                  <span className="text-xs text-zinc-400">{order.seller_profile.rating} rating</span>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-100 my-6" />
          </>
        )}

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Condition</span>
            <span className="text-sm text-zinc-600">{order.listing.condition}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Size</span>
            <span className="text-sm text-zinc-600">{order.listing.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Category</span>
            <span className="text-sm text-zinc-600">{order.listing.category}</span>
          </div>
        </div>

        <div className="border-t border-zinc-100 my-6" />

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Payment reference</span>
            <span className="text-sm text-zinc-400 font-mono">{shortId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Order date</span>
            <span className="text-sm text-zinc-400">
              {new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>

        <div className="border-t border-zinc-100 my-6" />

        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
          <Shield size={14} />
          <span>Buyer protection included</span>
        </div>

        {order.status === 'shipped' && (
          <div className="mt-2 p-4 rounded-[16px] bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={15} className="text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">Your item is on the way!</p>
            </div>
            <p className="text-xs text-blue-500 mb-3">Tap below once you've physically received the package.</p>
            <Link
              to={`/confirm/${order.id}`}
              className="block w-full py-2.5 rounded-full bg-black text-white text-sm font-semibold text-center hover:bg-zinc-800 transition-colors duration-200"
            >
              Confirm I received this item
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
