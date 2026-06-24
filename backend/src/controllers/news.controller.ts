import { Controller, Get, Query } from '@nestjs/common';
import { NewsService } from '../services/news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('impact')
  async getImpact(@Query('filter') filter?: string) {
    return this.news.getImpactNews(filter);
  }
}
