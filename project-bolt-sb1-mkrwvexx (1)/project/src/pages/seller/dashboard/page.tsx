import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingBag, Plus } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import type { Listing } from '../../../lib/types';

type ListingStatus = 'Active' | 'Sold' | 'Paused';

interface DashboardListing extends Listing {
  status: ListingStatus;
}

interface Stats {
  totalListings: number;
  totalSales: number;
  totalEarned: number;
}

const PRODUCT_IMAGES: Record<string, string> = {
  Tops: 'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bottoms: 'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
  Shoes: 'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
  Bags: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  Accessories: 'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
};

function StatusBadge({ status }: { status: ListingStatus }) {
  const styles: Record<ListingStatus, string> = {
    Active: 'bg-zinc-900 text-white',
    Sold: 'bg-zinc-400 text-white',
    Paused: 'bg-zinc-200 text-zinc-600',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, loading }: {
  icon: React.ElementType;
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-zinc-100 p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center">
          <Icon size={18} className="text-zinc-500" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      {loading ? (
        <div className="shimmer h-7 w-24 rounded-full" />
      ) : (
        <p className="text-2xl font-bold text-zinc-950">{value}</p>
      )}
    </div>
  );
}

export default function SellerDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalListings: 0, totalSales: 0, totalEarned: 0 });
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [loading, setLoading] = useState(true);

  const isSeller = profile?.role === 'seller';

  useEffect(() => {
    if (!authLoading && (!user || !isSeller)) return;
    if (user && isSeller) fetchDashboard();
  }, [user, authLoading, isSeller]);

  async function fetchDashboard() {
    setLoading(true);

    const { data: profile } = await supabase
      .from('seller_profiles')
      .select('seller_id')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!profile) {
      setLoading(false);
      return;
    }

    const sid = profile.seller_id;

    const [listingsRes, ordersRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('seller_id', sid)
        .order('created_at', { ascending: false }),
      supabase
        .from('orders')
        .select('amount')
        .eq('seller_id', sid)
        .eq('status', 'paid'),
    ]);

    const listingData = (listingsRes.data || []) as DashboardListing[];
    const orderData = ordersRes.data || [];

    // Mark sold listings — for demo, mark first listing as sold if there are orders
    if (orderData.length > 0 && listingData.length > 0) {
      listingData[0].status = 'Sold';
    }
    listingData.forEach((l) => {
      if (!l.status) l.status = 'Active';
    });

    setListings(listingData);
    setStats({
      totalListings: listingData.length,
      totalSales: orderData.length,
      totalEarned: orderData.reduce((sum, o) => sum + Number(o.amount), 0),
    });
    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-200 border-t-black animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isSeller) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-950">Dashboard</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your listings and track sales</p>
          </div>
          <Link
            to="/sell"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New listing</span>
            <span className="sm:hidden">New</span>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            icon={Package}
            label="Total listings"
            value={stats.totalListings.toString()}
            loading={loading}
          />
          <StatCard
            icon={ShoppingBag}
            label="Total sales"
            value={stats.totalSales.toString()}
            loading={loading}
          />
          <StatCard
            icon={DollarSign}
            label="Total earned"
            value={`GHS ${stats.totalEarned.toFixed(2)}`}
            loading={loading}
          />
        </div>

        {/* Listings */}
        <h2 className="text-lg font-semibold text-zinc-950 mb-4">Your listings</h2>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="break-inside-avoid mb-4 rounded-[20px] border border-zinc-100 bg-white overflow-hidden">
                <div className="shimmer" style={{ height: `${[280, 340, 400, 320, 360, 300][i % 6]}px` }} />
                <div className="p-4 space-y-3">
                  <div className="shimmer h-4 w-3/4 rounded-full" />
                  <div className="shimmer h-4 w-1/3 rounded-full" />
                  <div className="shimmer h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Package size={28} className="text-zinc-400" />
            </div>
            <p className="text-zinc-500 text-sm mb-1">No listings yet.</p>
            <p className="text-zinc-400 text-xs mb-6">Hit New listing to start selling.</p>
            <Link
              to="/sell"
              className="px-6 py-3 rounded-full bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors duration-200"
            >
              New listing
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
            {listings.map((listing, i) => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="break-inside-avoid mb-4 block rounded-[20px] border border-zinc-100 bg-white overflow-hidden transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-zinc-200 group animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className="bg-white overflow-hidden"
                  style={{ height: `${listing.image_height}px` }}
                >
                  <img
                    src={PRODUCT_IMAGES[listing.category] || PRODUCT_IMAGES.Tops}
                    alt={listing.title}
                    className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-zinc-950 leading-tight line-clamp-2">
                      {listing.title}
                    </h3>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="text-base font-bold text-black mt-1">
                    GHS {Number(listing.price).toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
