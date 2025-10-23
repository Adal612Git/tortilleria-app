import { GetProductsUseCase } from '../../domain/use-cases/products/GetProductsUseCase';
import { ProductRepositoryImpl } from '../../infrastructure/repositories/ProductRepositoryImpl';

export class ProductService {
  private getProductsUseCase: GetProductsUseCase;

  constructor() {
    const productRepository = new ProductRepositoryImpl();
    this.getProductsUseCase = new GetProductsUseCase(productRepository);
  }

  async getProducts() {
    return await this.getProductsUseCase.execute();
  }
}