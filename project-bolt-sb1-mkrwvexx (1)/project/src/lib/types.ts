export interface Seller {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  joined_date: string;
  item_count: number;
}

export interface Listing {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  condition: string;
  size: string;
  category: string;
  brand: string;
  description: string;
  image_url: string;
  image_clean: string;
  image_height: number;
  images: string[];
  quantity: number;
  status: string;
  listing_type: 'secondhand' | 'brand_new';
  created_at: string;
  seller?: Seller;
}

export type ListingType = 'secondhand' | 'brand_new';

export type Category = 'All' | 'Men' | 'Women' | 'Tops' | 'Bottoms' | 'Shoes' | 'Bags' | 'Accessories' | 'Dresses' | 'Outerwear' | 'Other';
export type Condition = 'New' | 'Like New' | 'Good' | 'Fair';

export const CATEGORIES: Category[] = ['All', 'Men', 'Women', 'Tops', 'Bottoms', 'Shoes', 'Bags', 'Accessories', 'Dresses', 'Outerwear', 'Other'];
export const CONDITIONS: Condition[] = ['New', 'Like New', 'Good', 'Fair'];
