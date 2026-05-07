import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Heart, X, CheckCircle, MapPin, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useWishlist } from '../lib/wishlist';
import type { Listing } from '../lib/types';

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=800',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=800',
};

function loadPaystack(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [lastPaymentRef, setLastPaymentRef] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [paymentAttempted, setPaymentAttempted] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const { user, profile } = useAuth();
  const { wishlistedIds, toggleWishlist } = useWishlist();

  const isBuyer = !!user && profile?.role !== 'seller';
  const isWishlisted = id ? wishlistedIds.has(id) : false;

  useEffect(() => {
    if (id) fetchListing();
    loadPaystack();
  }, [id]);

  async function fetchListing() {
    const { data } = await supabase
      .from('listings')
      .select('*, seller:sellers(*)')
      .eq('id', id!)
      .maybeSingle();
    setListing(data);
    setLoading(false);
  }

  async function generateQR(id: string): Promise<string> {
    const QRCode = (await import('qrcode')).default;
    return QRCode.toDataURL(`${window.location.origin}/confirm/${id}`, {
      width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' },
    });
  }

  function downloadQR(dataUrl: string, id: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `thriftly-order-${id}.png`;
    link.click();
  }

  async function handleVerifyPayment() {
    if (!user || !listing || !lastPaymentRef) return;
    setVerifying(true);
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        reference: lastPaymentRef,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: listing.id,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_phone: deliveryPhone,
      },
    });
    setVerifying(false);
    if (error || !data?.success) {
      const msg = data?.error || error?.message || 'Payment not confirmed yet.';
      alert(`${msg}\n\nIf you approved on your phone, wait 1–2 minutes and try again.`);
      return;
    }
    const newOrderId: string = data?.order_id || '';
    setOrderId(newOrderId);
    if (newOrderId) {
      const qr = await generateQR(newOrderId);
      setQrDataUrl(qr);
    }
    setPaymentCancelled(false);
    setOrderSuccess(true);
  }

  async function handleProceedToPayment() {
    if (!user || !listing) return;
    if (!deliveryAddress.trim() || !deliveryCity.trim() || !deliveryPhone.trim()) return;

    setProcessingPayment(true);
    setPaymentCancelled(false);

    try {
      await loadPaystack();

      const ref = `thriftly_${Date.now()}`;
      setLastPaymentRef(ref);
      setPaymentAttempted(true);

      const paystackConfig: any = {
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Math.round(listing.price * 100),
        currency: 'GHS',
        channels: ['mobile_money'],
        ref,
        onSuccess: async (transaction: any) => {
          const { data, error } = await supabase.functions.invoke('verify-payment', {
            body: {
              reference: transaction.reference,
              buyer_id: user.id,
              seller_id: listing.seller_id,
              listing_id: listing.id,
              delivery_address: deliveryAddress,
              delivery_city: deliveryCity,
              delivery_phone: deliveryPhone,
            },
          });

          if (error || !data?.success) {
            alert('Payment received but order save failed — please contact support.');
            setProcessingPayment(false);
            return;
          }

          let newOrderId: string = data?.order_id || '';
          if (!newOrderId && data?.already_saved) {
            const { data: existing } = await supabase
              .from('orders').select('id').eq('paystack_ref', transaction.reference).maybeSingle();
            newOrderId = existing?.id || '';
          }

          setOrderId(newOrderId);
          if (newOrderId) {
            const qr = await generateQR(newOrderId);
            setQrDataUrl(qr);
          }

          setShowCheckout(false);
          setOrderSuccess(true);
          setProcessingPayment(false);
        },
        onCancel: () => {
          setPaymentCancelled(true);
          setProcessingPayment(false);
        },
      };

      const handler = (window as any).PaystackPop.setup(paystackConfig);
      handler.openIframe();
    } catch {
      setProcessingPayment(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="shimmer aspect-square rounded-[24px]" />
          <div className="space-y-4 py-4">
            <div className="shimmer h-6 w-3/4 rounded-full" />
            <div className="shimmer h-5 w-1/3 rounded-full" />
            <div className="shimmer h-4 w-1/2 rounded-full" />
            <div className="shimmer h-20 w-full rounded-[16px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 text-lg mb-4">This listing is no longer available.</p>
          <a href="/" className="bg-black text-white px-6 py-3 rounded-full text-sm">
            Browse listings
          </a>
        </div>
      </div>
    );
  }

  const image = (listing as any).image_clean || (listing as any).image_url || PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops;

  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-950">Order placed!</h1>
            <p className="text-sm text-zinc-400 mt-1">{listing.title}</p>
          </div>

          {qrDataUrl && (
            <div className="flex flex-col items-center mb-6">
              <p className="text-xs text-zinc-500 mb-3">QR Confirmation Code</p>
              <img
                src={qrDataUrl}
                alt="Order QR Code"
                className="w-[260px] h-[260px] rounded-2xl border border-zinc-100"
              />
              <p className="text-xs text-zinc-400 mt-3 text-center">
                Your seller will scan this to confirm your delivery
              </p>
            </div>
          )}

          <div className="space-y-2">
            {qrDataUrl && orderId && (
              <button
                onClick={() => downloadQR(qrDataUrl, orderId)}
                className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
              >
                Download QR sticker
              </button>
            )}
            <Link
              to={orderId ? `/confirm/${orderId}` : '/orders'}
              className="block w-full py-3.5 rounded-full border border-zinc-200 text-zinc-700 text-sm font-medium text-center hover:border-zinc-300 transition-colors duration-200"
            >
              View order status
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="space-y-3">
            <div className="bg-white rounded-[24px] overflow-hidden border border-zinc-100 aspect-square lg:aspect-auto lg:min-h-[560px] relative">
              <img
                src={image}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              {isBuyer && (
                <button
                  onClick={() => toggleWishlist(listing.id)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 z-10"
                >
                  <Heart
                    size={20}
                    className={`transition-all duration-200 ${
                      isWishlisted ? 'text-black fill-black' : 'text-zinc-400 fill-transparent'
                    }`}
                  />
                </button>
              )}
            </div>
            {listing.images && listing.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {listing.images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxUrl(url)}
                    className="aspect-square rounded-[16px] overflow-hidden border border-zinc-100 bg-zinc-50 hover:opacity-90 transition-opacity"
                  >
                    <img src={url} alt={`${listing.title} styled ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="py-2 lg:py-4 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-zinc-950 leading-tight">
                {listing.title}
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-black mt-2">
                GHS {listing.price.toFixed(2)}
              </p>
            </div>

            {listing.seller && (
              <Link
                to={`/seller/${listing.seller.id}`}
                className="flex items-center gap-3 group"
              >
                <img
                  src={listing.seller.avatar}
                  alt={listing.seller.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-100"
                />
                <div>
                  <p className="text-sm font-medium text-zinc-950 group-hover:text-zinc-700 transition-colors">
                    {listing.seller.name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-zinc-400 fill-zinc-400" />
                    <span className="text-xs text-zinc-400">
                      {listing.seller.rating} · {listing.seller.item_count} items
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                {listing.condition}
              </span>
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                Size {listing.size}
              </span>
              {listing.quantity > 1 && (
                <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-950 text-white">
                  {listing.quantity} in stock
                </span>
              )}
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                {listing.category}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-950 mb-2">Description</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 pt-2">
              <Shield size={14} />
              <span>Buyer protection included</span>
            </div>

            <div className="space-y-3 pt-2">
              {isBuyer && (
                <button
                  onClick={() => { setPaymentCancelled(false); setShowCheckout(true); }}
                  disabled={(listing as any).status === 'sold'}
                  className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed active:bg-zinc-900 transition-colors duration-200"
                >
                  {(listing as any).status === 'sold' ? 'Sold out' : 'Buy now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCheckout(false)}
          />
          <div className="relative bg-white rounded-[28px] w-full max-w-md p-6 shadow-2xl">
            <button
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
            >
              <X size={16} className="text-zinc-600" />
            </button>

            <h2 className="text-lg font-semibold text-zinc-950 mb-5">Checkout</h2>

            <div className="flex gap-4 mb-6 pb-5 border-b border-zinc-100">
              <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-zinc-100 shrink-0">
                <img src={image} alt={listing.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-950 truncate">{listing.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{listing.condition} · Size {listing.size}</p>
                <p className="text-lg font-bold text-black mt-1">GHS {listing.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={12} />
                  Delivery address
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. 12 Accra Road, East Legon"
                  className="w-full px-4 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 block">City</label>
                <input
                  type="text"
                  value={deliveryCity}
                  onChange={(e) => setDeliveryCity(e.target.value)}
                  placeholder="e.g. Accra"
                  className="w-full px-4 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1.5 flex items-center gap-1.5">
                  <Phone size={12} />
                  Phone number for delivery
                </label>
                <input
                  type="tel"
                  value={deliveryPhone}
                  onChange={(e) => setDeliveryPhone(e.target.value)}
                  placeholder="e.g. 0241234567"
                  className="w-full px-4 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-950 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>
            </div>

            {paymentAttempted && lastPaymentRef && (
              <div className="mb-3 p-3 rounded-[12px] bg-zinc-50 border border-zinc-100 text-center">
                <p className="text-xs text-zinc-500 mb-2">Approved the payment on your phone?</p>
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  className="text-xs font-semibold text-zinc-950 underline underline-offset-2 disabled:opacity-50"
                >
                  {verifying ? 'Checking...' : 'I already paid — confirm my order'}
                </button>
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={
                processingPayment ||
                !deliveryAddress.trim() ||
                !deliveryCity.trim() ||
                !deliveryPhone.trim()
              }
              className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {processingPayment
                ? 'Opening payment...'
                : `Proceed to payment · GHS ${listing.price.toFixed(2)}`}
            </button>
          </div>
        </div>
      )}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
          <img
            src={lightboxUrl}
            alt="Styled photo"
            className="max-w-full max-h-full rounded-[20px] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
