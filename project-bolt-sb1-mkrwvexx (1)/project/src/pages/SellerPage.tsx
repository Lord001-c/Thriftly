import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Package } from 'lucide-react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { supabase } from '../lib/supabase';
import type { Seller, Listing } from '../lib/types';

export default function SellerPage() {
  const { id } = useParams<{ id: string }>();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchSeller();
  }, [id]);

  async function fetchSeller() {
    const [sellerRes, listingsRes] = await Promise.all([
      supabase.from('sellers').select('*').eq('id', id!).maybeSingle(),
      supabase.from('listings').select('*, seller:sellers(*)').eq('seller_id', id!),
    ]);
    setSeller(sellerRes.data);
    setListings(listingsRes.data || []);
    setLoading(false);
  }

  const joinedDate = seller
    ? new Date(seller.joined_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-200 mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </Link>

        {loading ? (
          <div className="bg-white rounded-[24px] border border-zinc-100 p-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="shimmer w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <div className="shimmer h-5 w-32 rounded-full" />
                <div className="shimmer h-4 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ) : seller ? (
          <div className="bg-white rounded-[24px] border border-zinc-100 p-6 sm:p-8 mb-8">
            <div className="flex items-start gap-4 sm:gap-6">
              <img
                src={seller.avatar}
                alt={seller.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-zinc-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950">
                  {seller.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-zinc-400 fill-zinc-400" />
                    <span className="text-sm text-zinc-500">{seller.rating} rating</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-zinc-400" />
                    <span className="text-sm text-zinc-500">{seller.item_count} items</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-zinc-400" />
                    <span className="text-sm text-zinc-500">Joined {joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <h2 className="text-lg font-semibold text-zinc-950 mb-4">
          Listings{seller ? ` by ${seller.name}` : ''}
        </h2>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
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
