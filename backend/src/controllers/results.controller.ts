import { Controller, Get } from '@nestjs/common';
import { ResultsService } from '../services/results.service';

@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Get('daily')
  async getDaily() {
    return this.results.getDailyResults();
  }

  @Get('weekly')
  async getWeekly() {
    return this.results.getWeeklyReport();
  }
}
