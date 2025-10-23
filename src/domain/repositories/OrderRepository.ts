import { Order } from '../entities/Order';

export interface OrderRepository {
  getAll(): Promise<Order[]>;
  getById(id: string): Promise<Order>;
  create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order>;
  updateStatus(id: string, status: Order['status']): Promise<Order>;
  getByCustomer(customerId: string): Promise<Order[]>;
}