import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductHandler } from './product.handler';

@Module({
  providers: [
    ProductService,
    ProductHandler,
  ],
  exports: [
    ProductService,
    ProductHandler,
  ],
})
export class ProductModule {}