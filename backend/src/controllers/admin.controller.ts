import { Controller, Post, Get, Body, Headers, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { ConfigService } from '../services/config.service';

@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService, private config: ConfigService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.admin.login(body.username, body.password);
  }

  @Get('dashboard')
  async dashboard(@Headers('authorization') auth: string) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    return this.admin.getDashboard();
  }

  @Get('vip-list')
  async vipList(@Headers('authorization') auth: string) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    return this.admin.getVipList();
  }

  @Post('add-vip')
  async addVip(@Headers('authorization') auth: string, @Body() body: { deviceId: string; months: number }) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    return this.admin.addManualVip(body.deviceId, body.months || 1);
  }

  @Post('cancel-vip')
  async cancelVip(@Headers('authorization') auth: string, @Body() body: { id: string }) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    return this.admin.cancelVip(body.id);
  }

  @Get('price')
  async getPrice(@Headers('authorization') auth: string) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    return { price: this.config.getVipPrice(), currency: 'TRY' };
  }

  @Post('update-price')
  async updatePrice(@Headers('authorization') auth: string, @Body() body: { price: number }) {
    if (!auth) throw new HttpException('Token gerekli', HttpStatus.UNAUTHORIZED);
    await this.admin.verifyToken(auth.replace('Bearer ', ''));
    if (!body.price || body.price < 100) throw new HttpException('Fiyat en az 100 olmalı', HttpStatus.BAD_REQUEST);
    const newPrice = this.config.setVipPrice(body.price);
    return { success: true, price: newPrice, currency: 'TRY' };
  }
}
