// ============================================================
// ORTAK VERİ TİPLERİ
// Backend ile frontend arasındaki veri yapıları.
// ============================================================

export interface MarketAsset {
  id: string; symbol: string; name: string; market: string;
  price: string; alpha: number; upProb: number; downProb: number;
  confidence: string; risk: string; signal: string; summary: string;
  valid: string; source: string; tags: string[]; reasons: string[]; kinds: string[];
}

export interface MatchItem {
  id: string; home: string; away: string; league: string;
  time: string; score: string; filter: string[];
  confidence: number; result: string; market: string; ms: string;
  goals: string; kg: string; scorePred: string;
  homeProb: number; drawProb: number; awayProb: number;
  risk: string; source: string; tags: string[]; reasons: string[];
}

export interface TrapItem {
  id: string; kind: string; type: string[]; title: string; subtitle: string;
  score: number; crowd: number; data: number; trap: number; risk: string; label: string;
  crowdView: string; dataView: string; result: string;
  tags: string[]; ifThen: string[];
}

export interface NewsItem {
  id: string; type: string[]; icon: string;
  title: string; summary: string; tags: string[]; impact: string;
}

export interface ResultItem {
  id: string; home: string; away: string; league: string; final: string;
  prediction: string; status: string; confidence: number;
  tags: string[]; reasons: string[];
}

export interface AiExplanation {
  type: string; generatedAt: string; model: string;
  explanation: string; disclaimer: string;
}

export interface WeeklyReport {
  weekStart: string; weekEnd: string;
  totalMatches: number; hitCount: number; missCount: number; partialCount: number;
  successRate: string; aiSummary: string; details: ResultItem[];
}
