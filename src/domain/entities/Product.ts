export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'kg' | 'piece' | 'dozen';
  stock: number;
  imageUrl?: string;
  category: 'tortilla' | 'tostada' | 'masa' | 'other';
  isActive: boolean;
  createdAt: Date;
}