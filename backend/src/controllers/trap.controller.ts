import { Controller, Get, Param, Query } from '@nestjs/common';
import { TrapService } from '../services/trap.service';

@Controller('trap')
export class TrapController {
  constructor(private readonly trap: TrapService) {}

  @Get('all')
  async getAll(@Query('filter') filter?: string) {
    return this.trap.getAllTraps(filter);
  }

  @Get('market')
  async getMarketTraps() {
    return this.trap.getMarketTraps();
  }

  @Get('match')
  async getMatchTraps() {
    return this.trap.getMatchTraps();
  }

  @Get(':id/detail')
  async getDetail(@Param('id') id: string) {
    return this.trap.getTrapDetail(id);
  }
}
