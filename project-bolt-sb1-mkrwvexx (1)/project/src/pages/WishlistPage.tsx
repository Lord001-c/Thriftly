import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { useWishlist } from '../lib/wishlist';
import type { Listing } from '../lib/types';

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

interface WishlistItem extends Listing {
  isSold?: boolean;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { toggleWishlist } = useWishlist();
  const [listings, setListings] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) fetchWishlist();
  }, [user]);

  async function fetchWishlist() {
    setLoading(true);
    const { data } = await supabase
      .from('wishlist')
      .select('listing:listing_id(*, seller:sellers(*))')
      .eq('user_id', user!.id);
    const items = ((data || []) as any[]).map((d) => d.listing).filter(Boolean);
    setListings(items);
    setLoading(false);
  }

  const handleRemove = useCallback(async (listingId: string) => {
    setRemovingIds((prev) => new Set(prev).add(listingId));
    await toggleWishlist(listingId);
    setTimeout(() => {
      setListings((prev) => prev.filter((l) => l.id !== listingId));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    }, 300);
  }, [toggleWishlist]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950 mb-2">Wishlist</h1>
        <p className="text-sm text-zinc-400 mb-6">Items you've saved for later</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-zinc-100 overflow-hidden">
                <div className="shimmer h-64" />
                <div className="p-4 space-y-3">
                  <div className="shimmer h-4 w-3/4 rounded-full" />
                  <div className="shimmer h-4 w-1/3 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Heart size={28} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 text-sm mb-1">No saved items yet</p>
            <p className="text-zinc-400 text-xs mb-6">Tap the heart on items you love</p>
            <Link
              to="/"
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
            >
              Browse items
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => {
              const image = listing.image_clean || PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops;
              const isRemoving = removingIds.has(listing.id);

              return (
                <div
                  key={listing.id}
                  className={`bg-white rounded-[20px] border border-zinc-100 overflow-hidden transition-all duration-300 ${
                    isRemoving ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div className="h-64 overflow-hidden">
                    <img
                      src={image}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-zinc-950 leading-tight line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-base font-bold text-black mt-1">
                      GHS {listing.price.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-zinc-400">{listing.condition}</span>
                      <span className="text-zinc-200">·</span>
                      <span className="text-xs text-zinc-400">{listing.size}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => handleRemove(listing.id)}
                        className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors duration-200 shrink-0"
                      >
                        <Heart size={16} className="text-black fill-black" />
                      </button>
                      {listing.isSold ? (
                        <span className="flex-1 py-2.5 rounded-full bg-zinc-200 text-zinc-500 text-sm font-medium text-center">
                          Sold
                        </span>
                      ) : (
                        <Link
                          to={`/listing/${listing.id}`}
                          className="flex-1 py-2.5 rounded-full bg-black text-white text-sm font-semibold text-center hover:bg-zinc-800 transition-colors duration-200"
                        >
                          Checkout
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
