import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from '../services/ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('explain')
  async explain(@Body() body: { type: string; id: string; data: any }) {
    return this.ai.generateExplanation(body.type, body.id, body.data);
  }
}
