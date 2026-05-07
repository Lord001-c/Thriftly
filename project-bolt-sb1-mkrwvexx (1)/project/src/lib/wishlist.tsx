import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';

interface WishlistContextType {
  wishlistedIds: Set<string>;
  toggleWishlist: (listingId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistedIds: new Set(),
  toggleWishlist: async () => {},
  loading: true,
});

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const isBuyer = !!user && profile?.role !== 'seller';

  useEffect(() => {
    if (user && isBuyer) {
      fetchWishlist();
    } else {
      setWishlistedIds(new Set());
      setLoading(false);
    }
  }, [user, isBuyer]);

  async function fetchWishlist() {
    if (!user) return;
    const { data } = await supabase
      .from('wishlist')
      .select('listing_id')
      .eq('user_id', user.id);
    setWishlistedIds(new Set((data || []).map((d: { listing_id: string }) => d.listing_id)));
    setLoading(false);
  }

  const toggleWishlist = useCallback(async (listingId: string) => {
    if (!user || !isBuyer) return;

    const isWishlisted = wishlistedIds.has(listingId);

    // Optimistic update
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (isWishlisted) next.delete(listingId);
      else next.add(listingId);
      return next;
    });

    if (isWishlisted) {
      await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId);
    } else {
      await supabase
        .from('wishlist')
        .insert({ user_id: user.id, listing_id: listingId });
    }
  }, [user, isBuyer, wishlistedIds]);

  return (
    <WishlistContext.Provider value={{ wishlistedIds, toggleWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
