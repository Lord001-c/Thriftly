import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Listing } from '../lib/types';
import { useAuth } from '../lib/auth';
import { useWishlist } from '../lib/wishlist';

interface ProductCardProps {
  listing: Listing;
}

const PRODUCT_IMAGES: Record<string, string[]> = {
  Tops: [
    'https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/6765164/pexels-photo-6765164.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/9558689/pexels-photo-9558689.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  Bottoms: [
    'https://images.pexels.com/photos/6765028/pexels-photo-6765028.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/6044266/pexels-photo-6044266.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  Shoes: [
    'https://images.pexels.com/photos/1464624/pexels-photo-1464624.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  Bags: [
    'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
  Accessories: [
    'https://images.pexels.com/photos/7018405/pexels-photo-7018405.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&w=400',
  ],
};

function getFallbackImage(listing: Listing): string {
  const cat = listing.category as keyof typeof PRODUCT_IMAGES;
  const images = PRODUCT_IMAGES[cat] || PRODUCT_IMAGES.Tops;
  const index = listing.id.charCodeAt(0) % images.length;
  return images[index];
}

export default function ProductCard({ listing }: ProductCardProps) {
  const image = (listing as any).image_clean || getFallbackImage(listing);
  const { user, profile } = useAuth();
  const { wishlistedIds, toggleWishlist } = useWishlist();

  const isBuyer = !!user && profile?.role !== 'seller';
  const isWishlisted = wishlistedIds.has(listing.id);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(listing.id);
  };

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="block rounded-[16px] sm:rounded-[20px] border border-zinc-100 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group relative"
    >
      {/* Image — fixed 4:5 portrait ratio */}
      <div className="relative w-full aspect-[4/5] bg-zinc-50 overflow-hidden">
        <img
          src={image}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          loading="lazy"
        />
        {listing.status === 'sold' && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-zinc-950 text-white text-[10px] font-semibold tracking-wide">SOLD</span>
          </div>
        )}
        {listing.status !== 'sold' && listing.quantity > 1 && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-zinc-700">{listing.quantity} in stock</span>
          </div>
        )}
        {isBuyer && listing.status !== 'sold' && (
          <button
            onClick={handleHeartClick}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 z-10"
          >
            <Heart
              size={13}
              className={`transition-all duration-200 ${
                isWishlisted ? 'text-black fill-black' : 'text-zinc-400 fill-transparent'
              }`}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        <h3 className="text-xs sm:text-sm font-medium text-zinc-950 leading-tight line-clamp-2">
          {listing.title}
        </h3>
        <p className="text-sm sm:text-base font-bold text-black mt-0.5">
          GHS {listing.price.toFixed(2)}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] sm:text-xs text-zinc-400">{listing.condition}</span>
          <span className="text-zinc-200">·</span>
          <span className="text-[10px] sm:text-xs text-zinc-400">{listing.size}</span>
        </div>
      </div>
    </Link>
  );
}
