import { Product } from '../../entities/Product';
import { ProductRepository } from '../../repositories/ProductRepository';

export class GetProductsUseCase {
  constructor(private productRepository: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return await this.productRepository.getAll();
  }
}