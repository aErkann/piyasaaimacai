import { Controller, Get, Param } from '@nestjs/common';
import { MatchesService } from '../services/matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get('daily-six')
  async getDailySix() {
    return this.matches.getDailySix();
  }

  @Get('live')
  async getLive() {
    return this.matches.getLiveScores();
  }

  @Get(':id/analysis')
  async getAnalysis(@Param('id') id: string) {
    return this.matches.getMatchAnalysis(id);
  }
}
