import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FilterPills from '../components/FilterPills';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { supabase } from '../lib/supabase';
import type { Listing, Category } from '../lib/types';

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('All');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchListings();
  }, [category, searchParams]);

  async function fetchListings() {
    setLoading(true);
    let query = supabase
      .from('listings')
      .select('*, seller:sellers(*)')
      .order('created_at', { ascending: false });

    if (category !== 'All') {
      query = query.eq('category', category);
    }

    const search = searchParams.get('search');
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <FilterPills selected={category} onSelect={setCategory} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {listings.map((listing, i) => (
              <div
                key={listing.id}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <ProductCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
