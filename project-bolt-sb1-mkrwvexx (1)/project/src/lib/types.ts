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
  description: string;
  image_url: string;
  image_height: number;
  created_at: string;
  seller?: Seller;
}

export type Category = 'All' | 'Tops' | 'Bottoms' | 'Shoes' | 'Bags' | 'Accessories';
export type Condition = 'New' | 'Like New' | 'Good' | 'Fair';

export const CATEGORIES: Category[] = ['All', 'Tops', 'Bottoms', 'Shoes', 'Bags', 'Accessories'];
export const CONDITIONS: Condition[] = ['New', 'Like New', 'Good', 'Fair'];
