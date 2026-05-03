import { Link } from 'react-router-dom';
import type { Listing } from '../lib/types';

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

function getImageForListing(listing: Listing): string {
  const cat = listing.category as keyof typeof PRODUCT_IMAGES;
  const images = PRODUCT_IMAGES[cat] || PRODUCT_IMAGES.Tops;
  const index = listing.id.charCodeAt(0) % images.length;
  return images[index];
}

export default function ProductCard({ listing }: ProductCardProps) {
  const image = getImageForListing(listing);

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="break-inside-avoid mb-4 block rounded-[20px] border border-zinc-100 bg-white overflow-hidden transition-all duration-200 ease-out hover:-translate-y-[3px] hover:border-zinc-200 group"
    >
      <div
        className="bg-white overflow-hidden"
        style={{ height: `${listing.image_height}px` }}
      >
        <img
          src={image}
          alt={listing.title}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-zinc-950 leading-tight line-clamp-2">
          {listing.title}
        </h3>
        <p className="text-base font-bold text-black mt-1">
          ${listing.price.toFixed(2)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-zinc-400">{listing.condition}</span>
          <span className="text-zinc-200">·</span>
          <span className="text-xs text-zinc-400">{listing.size}</span>
        </div>
      </div>
    </Link>
  );
}
