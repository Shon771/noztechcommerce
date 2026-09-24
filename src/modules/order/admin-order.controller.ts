import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { OrderService } from './order.service';
import { AdminApiKeyGuard } from './admin-api-key.guards';

@UseGuards(AdminApiKeyGuard)
@Controller('admin/orders')
export class AdminOrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Get()
  async getOrders() {
    return this.orderService.findAllForAdmin();
  }

  @Get(':orderId')
  async getOrder(
    @Param('orderId') orderId: string,
  ) {
    return this.orderService.findByIdForAdmin(
      orderId,
    );
  }

  @Post(':orderId/confirm')
async confirmOrder(
  @Param('orderId') orderId: string,
) {
  return this.orderService.confirmOrder(
    orderId,
  );
}

@Post(':orderId/process')
async processOrder(
  @Param('orderId') orderId: string,
) {
  return this.orderService.processOrder(
    orderId,
  );
}

@Post(':orderId/ship')
async shipOrder(
  @Param('orderId') orderId: string,
) {
  return this.orderService.shipOrder(
    orderId,
  );
}

@Post(':orderId/deliver')
async deliverOrder(
  @Param('orderId') orderId: string,
) {
  return this.orderService.deliverOrder(
    orderId,
  );
}

@Post(':orderId/cancel')
async cancelOrder(
  @Param('orderId') orderId: string,
) {
  return this.orderService.cancelOrder(
    orderId,
  );
}

}