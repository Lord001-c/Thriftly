import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Star, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Listing } from '../lib/types';

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=800',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=800',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=800',
};

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) fetchListing();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
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
      </div>
    );
  }

  if (!listing) return null;

  const image = PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="bg-white rounded-[24px] overflow-hidden border border-zinc-100 aspect-square lg:aspect-auto lg:min-h-[560px]">
            <img
              src={image}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="py-2 lg:py-4 space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-zinc-950 leading-tight">
                {listing.title}
              </h1>
              <p className="text-2xl sm:text-3xl font-bold text-black mt-2">
                ${listing.price.toFixed(2)}
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
              <button
                onClick={() => { if (!user) navigate('/signup'); }}
                className="w-full py-3.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 active:bg-zinc-900 transition-colors duration-200"
              >
                Buy now
              </button>
              <button className="w-full py-3.5 rounded-full bg-white text-zinc-700 text-sm font-medium border border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-200 flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                Message seller
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
