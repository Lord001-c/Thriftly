import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../lib/auth';

type ListingStatus = 'active' | 'sold' | 'paused';
type FilterStatus = 'all' | ListingStatus;

interface SellerListing {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  image_clean: string;
  image_height: number;
  status: ListingStatus;
  created_at: string;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: 'bg-zinc-900 text-white',
  sold: 'bg-zinc-400 text-white',
  paused: 'bg-zinc-200 text-zinc-600',
};

export default function SellerListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchListings();
  }, [user]);

  async function fetchListings() {
    setLoading(true);
    const { data: sp } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!sp) { setLoading(false); return; }

    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', sp.seller_id)
      .order('created_at', { ascending: false });

    const items = (data || []).map((l: any) => ({
      ...l,
      status: (l.status || 'active') as ListingStatus,
    }));
    setListings(items);
    setLoading(false);
  }

  async function deleteListing(listingId: string) {
    setDeleting(listingId);
    await supabase.from('listings').delete().eq('id', listingId);
    setListings(prev => prev.filter(l => l.id !== listingId));
    setConfirmDelete(null);
    setDeleting(null);
  }

  async function togglePause(listingId: string, currentStatus: ListingStatus) {
    const newStatus = currentStatus === 'paused' ? 'active' : 'paused';
    await supabase.from('listings').update({ status: newStatus }).eq('id', listingId);
    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: newStatus } : l))
    );
  }

  const filtered = filter === 'all' ? listings : listings.filter((l) => l.status === filter);
  const filters: FilterStatus[] = ['all', 'active', 'sold', 'paused'];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-950">Your Listings</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your items for sale</p>
        </div>
        <Link
          to="/sell"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
        >
          <Plus size={16} />
          New listing
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
              filter === f
                ? 'bg-black text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
            <Package size={28} className="text-zinc-400" />
          </div>
          <p className="text-zinc-500 text-sm mb-1">No listings found</p>
          <p className="text-zinc-400 text-xs mb-6">Hit New listing to start selling</p>
          <Link
            to="/sell"
            className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
          >
            New listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-[20px] border border-zinc-100 overflow-hidden group"
            >
              <div
                className="bg-white overflow-hidden relative"
                style={{ height: `${listing.image_height || 300}px` }}
              >
                <img
                  src={listing.image_clean || PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[listing.status]}`}>
                  {listing.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-medium text-zinc-950 leading-tight line-clamp-2">
                  {listing.title}
                </h3>
                <p className="text-base font-bold text-black mt-1">
                  GHS {Number(listing.price).toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {listing.status !== 'sold' && (
                    <button
                      onClick={() => togglePause(listing.id, listing.status)}
                      className="flex-1 py-2.5 rounded-full text-sm font-medium border border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-all duration-200"
                    >
                      {listing.status === 'paused' ? 'Resume' : 'Pause'}
                    </button>
                  )}
                  <Link
                    to={`/listing/${listing.id}`}
                    className="flex-1 py-2.5 rounded-full text-sm font-medium bg-black text-white text-center hover:bg-zinc-800 transition-colors duration-200"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(listing.id)}
                    className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all duration-200 shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] w-full max-w-xs p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-zinc-950 mb-1">Delete listing?</h3>
            <p className="text-sm text-zinc-400 mb-6">This can't be undone. The listing will be permanently removed.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-zinc-200 text-zinc-600 text-sm font-medium hover:border-zinc-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteListing(confirmDelete)}
                disabled={!!deleting}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
