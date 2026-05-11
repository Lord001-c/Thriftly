import { useEffect, useState } from 'react';
import { ShoppingBag, MapPin, Phone, CheckCircle, XCircle, QrCode, X, Truck } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

interface QrModal {
  orderId: string;
  qrDataUrl: string;
  title: string;
}

type FilterStatus = 'active' | 'delivered' | 'cancelled';

interface SellerOrder {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  delivery_address: string;
  delivery_city: string;
  delivery_phone: string;
  listing: { id: string; title: string; category: string; image_clean: string };
  buyerName: string;
  buyerPhone: string;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('active');
  const [qrModal, setQrModal] = useState<QrModal | null>(null);

  async function openQrModal(orderId: string, title: string) {
    const url = `${window.location.origin}/confirm/${orderId}`;
    const QRCode = (await import('qrcode')).default;
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' },
    });
    setQrModal({ orderId, qrDataUrl, title });
  }

  function downloadQR(dataUrl: string, orderId: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `thriftly-order-${orderId}.png`;
    link.click();
  }

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!sp) { setLoading(false); return; }

    // Step 1: fetch orders (no joins — avoids column-existence failures)
    const { data: ordersRaw, error } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, delivery_address, delivery_city, delivery_phone, buyer_id, listing_id')
      .eq('seller_id', sp.seller_id)
      .order('created_at', { ascending: false });

    if (error) { console.error('fetchOrders error:', error); setLoading(false); return; }
    if (!ordersRaw || ordersRaw.length === 0) { setOrders([]); setLoading(false); return; }

    // Step 2: fetch listings
    const listingIds = [...new Set(ordersRaw.map((o: any) => o.listing_id).filter(Boolean))];
    const { data: listingsRaw } = await supabase
      .from('listings')
      .select('id, title, category, image_clean')
      .in('id', listingIds);

    const listingMap = new Map((listingsRaw || []).map((l: any) => [l.id, l]));

    // Step 3: fetch buyer profiles
    const buyerIds = [...new Set(ordersRaw.map((o: any) => o.buyer_id).filter(Boolean))];
    const { data: buyerProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .in('id', buyerIds);

    const profileMap = new Map((buyerProfiles || []).map((p: any) => [p.id, { name: p.full_name, phone: p.phone }]));

    const mapped = ordersRaw.map((d: any) => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      created_at: d.created_at,
      delivery_address: d.delivery_address || '',
      delivery_city: d.delivery_city || '',
      delivery_phone: d.delivery_phone || '',
      listing: listingMap.get(d.listing_id) || { id: '', title: 'Unknown item', category: 'Tops', image_clean: '' },
      buyerName: profileMap.get(d.buyer_id)?.name || 'Buyer',
      buyerPhone: profileMap.get(d.buyer_id)?.phone || '',
    }));

    setOrders(mapped);
    setLoading(false);
  }

  async function markDispatched(orderId: string) {
    await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'shipped' } : o));
  }

  async function cancelOrder(orderId: string) {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  }

  const active = orders.filter(o => o.status === 'paid' || o.status === 'shipped');
  const delivered = orders.filter(o => o.status === 'delivered');
  const cancelled = orders.filter(o => o.status === 'cancelled');

  const filtered = filter === 'active' ? active : filter === 'delivered' ? delivered : cancelled;

  const tabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'active', label: 'New Orders', count: active.length },
    { key: 'delivered', label: 'Delivered', count: delivered.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelled.length },
  ];

  return (
    <>
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-950">Orders</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your sales and deliveries</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                filter === key ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {label}
              <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                filter === key ? 'bg-white text-black' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-zinc-100 p-5">
                <div className="flex gap-4">
                  <div className="shimmer w-16 h-16 rounded-[14px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="shimmer h-4 w-2/3 rounded-full" />
                    <div className="shimmer h-3 w-1/3 rounded-full" />
                    <div className="shimmer h-3 w-1/2 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 text-sm">
              {filter === 'active' ? 'No new orders' : filter === 'delivered' ? 'No delivered orders yet' : 'No cancelled orders'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <div key={order.id} className="bg-white rounded-[20px] border border-zinc-100 overflow-hidden">
                {/* Order header */}
                <div className="flex items-start gap-4 p-4 sm:p-5">
                  <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-zinc-100 shrink-0">
                    <img
                      src={order.listing.image_clean || PRODUCT_IMAGES[order.listing.category] || PRODUCT_IMAGES.Tops}
                      alt={order.listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-950 leading-tight">{order.listing.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">by {order.buyerName}</p>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-zinc-950">GHS {Number(order.amount).toFixed(2)}</p>
                  </div>
                </div>

                {/* Delivery details */}
                {(order.delivery_address || order.delivery_phone) && (
                  <div className="mx-4 sm:mx-5 mb-4 p-3 rounded-[14px] bg-zinc-50 border border-zinc-100 space-y-1.5">
                    {order.delivery_address && (
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-zinc-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-600">{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ''}</p>
                      </div>
                    )}
                    {order.delivery_phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-zinc-400 shrink-0" />
                        <p className="text-xs text-zinc-600">{order.delivery_phone}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: paid orders — dispatch + cancel */}
                {order.status === 'paid' && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => markDispatched(order.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
                      >
                        <Truck size={15} />
                        Mark as dispatched
                      </button>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 text-zinc-500 text-sm font-medium hover:border-zinc-300 hover:text-zinc-700 transition-all duration-200"
                      >
                        <XCircle size={15} />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions: shipped orders — QR only (buyer confirms delivery via scan) */}
                {order.status === 'shipped' && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                        <Truck size={11} />
                        Dispatched — awaiting delivery
                      </span>
                    </div>
                    <button
                      onClick={() => openQrModal(order.id, order.listing.title)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
                    >
                      <QrCode size={15} />
                      Show delivery QR code
                    </button>
                    <p className="text-[10px] text-zinc-400 text-center mt-2">Buyer scans this to confirm receipt</p>
                  </div>
                )}

                {/* Status badge for delivered / cancelled */}
                {(order.status === 'delivered' || order.status === 'cancelled') && (
                  <div className="px-4 sm:px-5 pb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-200 text-zinc-400'
                    }`}>
                      {order.status === 'delivered' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {order.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] w-full max-w-sm p-6 shadow-2xl">
            <p className="text-center text-lg font-bold text-zinc-950 mb-5 tracking-tight">Thriftly</p>

            <div className="flex justify-center mb-4">
              <img
                src={qrModal.qrDataUrl}
                alt="Order QR"
                className="w-[300px] h-[300px] rounded-2xl border border-zinc-100"
              />
            </div>

            <p className="text-center text-xs text-zinc-400 mb-1">Order #{qrModal.orderId.slice(0, 8)}</p>
            <p className="text-center text-sm font-medium text-zinc-950 mb-1 truncate px-4">{qrModal.title}</p>
            <p className="text-center text-xs text-zinc-400 mb-6">Buyer scans this QR to confirm delivery</p>

            <div className="space-y-2">
              <button
                onClick={() => downloadQR(qrModal.qrDataUrl, qrModal.orderId)}
                className="w-full py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
              >
                Download / Print sticker
              </button>
              <button
                onClick={() => setQrModal(null)}
                className="w-full py-3 rounded-full border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
