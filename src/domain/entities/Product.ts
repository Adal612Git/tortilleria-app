export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  unit: 'kg' | 'pieza' | 'docena';
  category: 'tortilla' | 'tostada' | 'masa' | 'otros';
  isActive: boolean;
  createdAt: Date;
}
