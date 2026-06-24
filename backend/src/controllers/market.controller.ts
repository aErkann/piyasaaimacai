import { Controller, Get, Query } from '@nestjs/common';
import { MarketService } from '../services/market.service';

@Controller('market')
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get('alpha')
  async getAlpha(@Query('filter') filter?: string) {
    return this.market.getAlphaRadar(filter);
  }

  @Get('bull')
  async getBull() {
    return this.market.getBullCandidates();
  }

  @Get('bear')
  async getBear() {
    return this.market.getBearCandidates();
  }

  @Get('new-crypto')
  async getNewCrypto() {
    return this.market.getNewCrypto();
  }

  @Get('local')
  async getLocal() {
    return this.market.getLocalOpportunities();
  }

  @Get('ipo')
  async getIpo() {
    return this.market.getIpoWatch();
  }
}
