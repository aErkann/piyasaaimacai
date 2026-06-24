import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

@Injectable()
export class ConfigService {
  private config: { vipMonthlyPrice: number };

  constructor() {
    this.config = this.load();
  }

  private load() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[Config] config.json okunamadı, varsayılan kullanılıyor');
    }
    return { vipMonthlyPrice: 800 };
  }

  private save() {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Config] config.json yazılamadı:', e.message);
    }
  }

  getVipPrice(): number {
    return this.config.vipMonthlyPrice || 800;
  }

  setVipPrice(price: number) {
    this.config.vipMonthlyPrice = price;
    this.save();
    return this.config.vipMonthlyPrice;
  }
}
