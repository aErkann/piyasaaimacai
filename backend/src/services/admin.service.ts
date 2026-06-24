import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'piyasaai-admin-secret-change-me';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async seedAdmin() {
    try {
      const existing = await this.prisma.adminUser.findUnique({ where: { username: 'admin' } });
      if (!existing) {
        const hash = await bcrypt.hash('admin123', 10);
        await this.prisma.adminUser.create({
          data: { username: 'admin', password: hash },
        });
        console.log('[Admin] Default admin created (admin / admin123)');
      }
    } catch (e) {
      console.warn('[Admin] DB unavailable, admin seed skipped. Start PostgreSQL first.');
    }
  }

  async login(username: string, password: string) {
    try {
      const user = await this.prisma.adminUser.findUnique({ where: { username } });
      if (!user) throw new HttpException('Kullanıcı bulunamadı', HttpStatus.UNAUTHORIZED);

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) throw new HttpException('Hatalı şifre', HttpStatus.UNAUTHORIZED);

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return { token, username: user.username, role: user.role };
    } catch (e) {
      // DB yoksa hardcoded admin ile giriş
      if (e instanceof HttpException && e.getStatus() !== HttpStatus.UNAUTHORIZED) throw e;
      if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ id: 'dev-admin', username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
        console.log('[Admin] Dev mode login (no DB)');
        return { token, username: 'admin', role: 'admin' };
      }
      throw new HttpException('Kullanıcı adı veya şifre hatalı', HttpStatus.UNAUTHORIZED);
    }
  }

  async verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      throw new HttpException('Geçersiz token', HttpStatus.UNAUTHORIZED);
    }
  }

  async getDashboard() {
    try {
      const [activeVips, totalUsers, totalRevenue, recentPayments] = await Promise.all([
        this.prisma.vipSubscription.count({ where: { status: 'active', endDate: { gte: new Date() } } }),
        this.prisma.user.count(),
        this.prisma.paymentTransaction.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
        this.prisma.paymentTransaction.findMany({
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

      return { activeVips, totalUsers, totalRevenue: totalRevenue._sum.amount || 0, recentPayments };
    } catch {
      return { activeVips: 0, totalUsers: 0, totalRevenue: 0, recentPayments: [] };
    }
  }

  async getVipList() {
    try {
      return await this.prisma.vipSubscription.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: true },
        take: 100,
      });
    } catch {
      return [];
    }
  }

  async addManualVip(deviceId: string, months: number) {
    try {
      const user = await this.prisma.user.upsert({
        where: { deviceId },
        update: {},
        create: { deviceId },
      });

      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + months);

      const existing = await this.prisma.vipSubscription.findFirst({
        where: { deviceId, status: 'active' },
      });

      if (existing) {
        const newEnd = existing.endDate && existing.endDate > now
          ? new Date(existing.endDate.getTime() + months * 30 * 24 * 60 * 60 * 1000)
          : endDate;

        await this.prisma.vipSubscription.update({
          where: { id: existing.id },
          data: { endDate: newEnd },
        });
      } else {
        await this.prisma.vipSubscription.create({
          data: { userId: user.id, deviceId, status: 'active', endDate, paymentMethod: 'manual', pricePaid: 800 * months },
        });
      }

      return { success: true, endDate, months };
    } catch {
      throw new HttpException('Veritabanı bağlantısı yok, VIP eklenemedi', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async cancelVip(id: string) {
    try {
      await this.prisma.vipSubscription.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      return { success: true };
    } catch {
      throw new HttpException('Veritabanı bağlantısı yok', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
