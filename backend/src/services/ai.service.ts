import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async generateExplanation(type: string, _id: string, data: any) {
    const explanation = this.buildExplanation(type, data);
    return {
      type,
      generatedAt: new Date().toISOString(),
      model: 'openai/gemini (configurable)',
      explanation,
      disclaimer: 'Bu içerik yatırım tavsiyesi veya kesin maç sonucu değildir.',
    };
  }

  private buildExplanation(type: string, data: any): string {
    if (type === 'market') {
      return `${data.symbol} için alpha skoru ${data.alpha}/100. ${data.summary} `
        + `Yükseliş ihtimali %${data.upProb}, düşüş riski %${data.downProb}. `
        + 'Bu sinyal kesin al/sat önerisi değildir.';
    }
    if (type === 'match') {
      return `${data.home} - ${data.away}: Tahmin ${data.result}, güven ${data.confidence}/100. `
        + `Tahmini skor: ${data.scorePred}. MS: ${data.ms}, KG: ${data.kg}. `
        + 'Bu analiz istatistiksel verilere dayanır, kesin sonuç garantisi vermez.';
    }
    if (type === 'trap') {
      return `Tuzak skoru %${data.trap}. Kalabalık algısı: ${data.crowdView} `
        + `Veri karşılığı: ${data.dataView}. ${data.result} `
        + 'Tuzak radar kalabalık ile veri arasındaki çelişkiyi gösterir.';
    }
    return 'AI açıklama isteği alındı.';
  }
}
