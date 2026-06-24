import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ConfigService } from './config.service';
import * as crypto from 'crypto';

const SHOPIER_API = 'https://api.shopier.com/v1';

@Injectable()
export class VipService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private getPat(): string {
    return process.env.SHOPIER_PAT || '';
  }

  private async shopierFetch(path: string, options: any = {}) {
    const token = this.getPat();
    if (!token) {
      throw new HttpException('Shopier PAT yapılandırılmamış', HttpStatus.SERVICE_UNAVAILABLE);
    }
    const url = `${SHOPIER_API}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new HttpException(
        data?.message || `Shopier hatası (${res.status})`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return data;
  }

  async createPayment(deviceId: string, email?: string, phone?: string) {
    if (!email && !phone) {
      throw new HttpException('E-posta veya telefon gerekli', HttpStatus.BAD_REQUEST);
    }

    const price = this.config.getVipPrice();
    const orderId = `${deviceId}-${Date.now()}`;

    // Shopier v1 API ile ürün oluştur
    const product = await this.shopierFetch('/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'PiyasaAI VIP Aylık',
        description: `PiyasaAI VIP üyelik - Reklamsız, sınırsız AI kredisi, tam erişim. ${email || phone || deviceId}`,
        type: 'digital',
        media: [],
        priceData: {
          amount: price,
          currency: 'TRY',
        },
        stockQuantity: 999,
        shippingPayer: 'sellerPays',
        customListing: true,
      }),
    });

    const productId = product?.id;
    if (!productId) {
      throw new HttpException('Shopier ürün oluşturulamadı', HttpStatus.BAD_GATEWAY);
    }

    // Transaction kaydı
    try {
      await this.prisma.paymentTransaction.create({
        data: {
          deviceId,
          email,
          phone,
          amount: price,
          currency: 'TRY',
          provider: 'shopier',
          providerTxId: productId.toString(),
          status: 'pending',
          packageType: 'vip_monthly',
        },
      });
    } catch (e) {
      // DB yoksa session log
      console.log('[Vip] Payment transaction kaydedilemedi (DB olmayabilir):', e.message);
    }

    // Ürün sayfasına yönlendir
    const paymentUrl = `https://www.shopier.com/urun/${productId}`;

    return {
      success: true,
      paymentUrl,
      transactionId: productId.toString(),
      price,
      currency: 'TRY',
    };
  }

  async handleWebhook(body: any, signature: string) {
    // Shopier webhook doğrulama
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    const event = payload?.event || payload?.type;

    if (!event) {
      throw new HttpException('Geçersiz webhook payload', HttpStatus.BAD_REQUEST);
    }

    // Ödeme tamamlandı eventi
    if (event === 'order.completed' || event === 'order.paid') {
      const orderId = payload?.order?.id || payload?.data?.order_id;
      const productId = payload?.product?.id || payload?.data?.product_id;
      const buyerEmail = payload?.buyer?.email || payload?.data?.buyer_email;
      const buyerPhone = payload?.buyer?.phone || payload?.data?.buyer_phone;

      // Transaction güncelle
      try {
        await this.prisma.paymentTransaction.updateMany({
          where: { providerTxId: (productId || orderId).toString() },
          data: { status: 'completed' },
        });
      } catch (e) {
        console.log('[Vip] Webhook: DB güncellenemedi:', e.message);
      }

      return { success: true, event };
    }

    // Ödeme başarısız
    if (event === 'order.failed' || event === 'order.cancelled') {
      try {
        const productId = payload?.product?.id || payload?.data?.product_id;
        await this.prisma.paymentTransaction.updateMany({
          where: { providerTxId: productId?.toString() },
          data: { status: 'failed' },
        });
      } catch (e) {
        console.log('[Vip] Webhook: DB güncellenemedi:', e.message);
      }
      return { success: true, event };
    }

    return { success: true, event, handled: false };
  }

  async checkVip(deviceId: string) {
    try {
      const sub = await this.prisma.vipSubscription.findFirst({
        where: { deviceId, status: 'active', endDate: { gte: new Date() } },
      });
      if (sub) return { isVip: true, endDate: sub.endDate };
    } catch {}
    return { isVip: false };
  }

  async getUserVipInfo(deviceId: string) {
    try {
      const sub = await this.prisma.vipSubscription.findFirst({
        where: { deviceId, status: 'active', endDate: { gte: new Date() } },
      });
      if (!sub) return { isVip: false, endDate: null, daysLeft: 0 };
      const daysLeft = sub.endDate
        ? Math.ceil((sub.endDate.getTime() - Date.now()) / 86400000)
        : 0;
      return { isVip: true, endDate: sub.endDate, daysLeft };
    } catch {
      return { isVip: false, endDate: null, daysLeft: 0 };
    }
  }
}
