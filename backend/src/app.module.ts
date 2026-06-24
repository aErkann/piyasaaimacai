import { Module, OnModuleInit } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './controllers/health.controller';
import { MarketController } from './controllers/market.controller';
import { MatchesController } from './controllers/matches.controller';
import { TrapController } from './controllers/trap.controller';
import { NewsController } from './controllers/news.controller';
import { ResultsController } from './controllers/results.controller';
import { AiController } from './controllers/ai.controller';
import { AdsController } from './controllers/ads.controller';
import { VipController } from './controllers/vip.controller';
import { AdminController } from './controllers/admin.controller';
import { MarketService } from './services/market.service';
import { MatchesService } from './services/matches.service';
import { TrapService } from './services/trap.service';
import { NewsService } from './services/news.service';
import { ResultsService } from './services/results.service';
import { AiService } from './services/ai.service';
import { VipService } from './services/vip.service';
import { AdminService } from './services/admin.service';
import { ConfigService } from './services/config.service';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    HealthController,
    MarketController,
    MatchesController,
    TrapController,
    NewsController,
    ResultsController,
    AiController,
    AdsController,
    VipController,
    AdminController,
  ],
  providers: [
    MarketService,
    MatchesService,
    TrapService,
    NewsService,
    ResultsService,
    AiService,
    VipService,
    AdminService,
    ConfigService,
    PrismaService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private adminService: AdminService) {}
  async onModuleInit() {
    await this.adminService.seedAdmin();
  }
}
