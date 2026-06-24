import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { VipService } from '../services/vip.service';
import { ConfigService } from '../services/config.service';

@Controller('vip')
export class VipController {
  constructor(private vip: VipService, private config: ConfigService) {}

  @Get('price')
  getPrice() {
    return { price: this.config.getVipPrice(), currency: 'TRY' };
  }

  @Post('create-payment')
  async createPayment(@Body() body: { deviceId: string; email?: string; phone?: string }) {
    return this.vip.createPayment(body.deviceId, body.email, body.phone);
  }

  @Post('shopier-webhook')
  async shopierWebhook(
    @Body() body: any,
    @Headers('shopier-signature') signature: string,
  ) {
    return this.vip.handleWebhook(body, signature);
  }

  @Get('check')
  async checkVip(@Query('deviceId') deviceId: string) {
    return this.vip.checkVip(deviceId);
  }

  @Get('info')
  async vipInfo(@Query('deviceId') deviceId: string) {
    return this.vip.getUserVipInfo(deviceId);
  }
}
