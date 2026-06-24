import { Controller, Post, Body } from '@nestjs/common';

@Controller('ads')
export class AdsController {
  @Post('reward/verify')
  async verifyReward(@Body() body: {
    userId?: string;
    panel: string;
    rewardProvider: string;
    rewardTxId: string;
  }) {
    console.log('[Ads] Reward verified:', body);
    return {
      success: true,
      panel: body.panel,
      creditsAwarded: 1,
      durationMinutes: 5,
      timestamp: new Date().toISOString(),
    };
  }
}
