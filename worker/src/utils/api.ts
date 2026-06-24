import axios from 'axios';

const API_DOMAIN = process.env.API_DOMAIN || 'http://localhost:3000';

export async function fetchMarketData() {
  const { data } = await axios.get(`${API_DOMAIN}/market/alpha`);
  return data;
}

export async function fetchMatchData() {
  const { data } = await axios.get(`${API_DOMAIN}/matches/daily-six`);
  return data;
}

export async function postAiExplanation(type: string, id: string, payload: any) {
  const { data } = await axios.post(`${API_DOMAIN}/ai/explain`, { type, id, data: payload });
  return data;
}
