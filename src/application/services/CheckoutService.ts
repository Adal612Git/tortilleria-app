import { SalesRepository, CartItem } from '../../infrastructure/repositories/SalesRepository';

type CompleteSaleParams = {
  items: CartItem[];
  paidAmount: number;
  userId?: number;
  paymentMethod?: string;
};

export class CheckoutService {
  constructor(private repository = new SalesRepository()) {}

  async completeSale({ items, paidAmount, userId, paymentMethod }: CompleteSaleParams) {
    if (!items.length) {
      throw new Error('El carrito esta vacio');
    }
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await this.repository.recordSale(items, undefined, undefined, userId, paymentMethod ?? 'cash');
    const change = paidAmount - total;
    return {
      total,
      paidAmount,
      change,
      paymentMethod: paymentMethod ?? 'cash',
    };
  }
}
