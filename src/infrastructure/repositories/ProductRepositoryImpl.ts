import { Product } from '../../domain/entities/Product';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { ApiDataSource } from '../datasources/ApiDataSource';

export class ProductRepositoryImpl implements ProductRepository {
  private apiDataSource = new ApiDataSource();

  async getAll(): Promise<Product[]> {
    const response = await this.apiDataSource.get<{ products: Product[] }>('/products');
    return response.products;
  }

  async getById(id: string): Promise<Product> {
    const response = await this.apiDataSource.get<{ product: Product }>(`/products/${id}`);
    return response.product;
  }

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const response = await this.apiDataSource.post<{ product: Product }>('/products', product);
    return response.product;
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    const response = await this.apiDataSource.post<{ product: Product }>(
      `/products/${id}`,
      product
    );
    return response.product;
  }

  async delete(id: string): Promise<void> {
    await this.apiDataSource.post(`/products/${id}/delete`, {});
  }
}