import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import FilterPills from '../components/FilterPills';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { supabase } from '../lib/supabase';
import type { Listing, Category } from '../lib/types';

const PAGE_SIZE = 50;

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [category, setCategory] = useState<Category>('All');
  const [searchParams] = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset and reload when filters change
  useEffect(() => {
    setListings([]);
    setOffset(0);
    setHasMore(true);
    fetchListings(0, true);
  }, [category, searchParams]);

  async function fetchListings(from: number, reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true);

    let query = supabase
      .from('listings')
      .select('id, title, price, image_clean, image_height, condition, size, category, status, quantity, created_at, seller_id')
      .neq('status', 'sold')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (category !== 'All') query = query.eq('category', category);

    const search = searchParams.get('search');
    if (search) query = query.ilike('title', `%${search}%`);

    const { data } = await query;
    const rows = (data as unknown as Listing[]) || [];

    setListings(prev => reset ? rows : [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setOffset(from + rows.length);

    if (reset) setLoading(false); else setLoadingMore(false);
  }

  // IntersectionObserver — fires when sentinel enters viewport
  const onSentinel = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
      fetchListings(offset);
    }
  }, [hasMore, loadingMore, loading, offset]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(onSentinel, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onSentinel]);

  return (
    <>
      <FilterPills selected={category} onSelect={setCategory} />

      <div className="px-2 pb-6 sm:px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <span className="text-2xl">~</span>
            </div>
            <p className="text-zinc-500 text-sm">No items found</p>
            <p className="text-zinc-400 text-xs mt-1">Try a different category or search</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {listings.map((listing, i) => (
                <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
                  <ProductCard listing={listing} />
                </div>
              ))}
            </div>

            {/* Sentinel — triggers next page load */}
            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {!hasMore && listings.length > 0 && (
              <p className="text-center text-xs text-zinc-300 py-8">You've seen everything</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
