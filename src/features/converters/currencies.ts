/**
 * Reference exchange rates, expressed per 1 USD.
 *
 * NOVA ships with static rates so the converter works offline and with no API
 * key. `fetchRates` is the single seam for a live provider: point it at an
 * endpoint returning `{ base: 'USD', rates: {...} }` and everything else keeps
 * working unchanged.
 */
export interface Currency {
  code: string;
  symbol: string;
  name: { uk: string; en: string };
}

export const currencies: Currency[] = [
  { code: 'USD', symbol: '$', name: { uk: 'Долар США', en: 'US dollar' } },
  { code: 'EUR', symbol: '€', name: { uk: 'Євро', en: 'Euro' } },
  { code: 'UAH', symbol: '₴', name: { uk: 'Гривня', en: 'Ukrainian hryvnia' } },
  { code: 'GBP', symbol: '£', name: { uk: 'Фунт стерлінгів', en: 'British pound' } },
  { code: 'PLN', symbol: 'zł', name: { uk: 'Злотий', en: 'Polish złoty' } },
  { code: 'CHF', symbol: 'Fr', name: { uk: 'Швейцарський франк', en: 'Swiss franc' } },
  { code: 'JPY', symbol: '¥', name: { uk: 'Єна', en: 'Japanese yen' } },
  { code: 'CNY', symbol: '¥', name: { uk: 'Юань', en: 'Chinese yuan' } },
  { code: 'CAD', symbol: 'C$', name: { uk: 'Канадський долар', en: 'Canadian dollar' } },
  { code: 'AUD', symbol: 'A$', name: { uk: 'Австралійський долар', en: 'Australian dollar' } },
  { code: 'CZK', symbol: 'Kč', name: { uk: 'Чеська крона', en: 'Czech koruna' } },
  { code: 'TRY', symbol: '₺', name: { uk: 'Турецька ліра', en: 'Turkish lira' } },
];

export const REFERENCE_DATE = '2026-01-01';

export const referenceRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  UAH: 42.0,
  GBP: 0.79,
  PLN: 4.0,
  CHF: 0.88,
  JPY: 152.0,
  CNY: 7.2,
  CAD: 1.36,
  AUD: 1.52,
  CZK: 23.2,
  TRY: 34.5,
};

export const currencyAliases: Record<string, string> = {
  usd: 'USD', $: 'USD', dollar: 'USD', dollars: 'USD', долар: 'USD', доларів: 'USD', доларах: 'USD', бакс: 'USD',
  eur: 'EUR', '€': 'EUR', euro: 'EUR', євро: 'EUR',
  uah: 'UAH', '₴': 'UAH', hryvnia: 'UAH', грн: 'UAH', гривень: 'UAH', гривні: 'UAH', гривня: 'UAH',
  gbp: 'GBP', '£': 'GBP', pound: 'GBP', фунт: 'GBP', фунтів: 'GBP',
  pln: 'PLN', zloty: 'PLN', злотий: 'PLN', злотих: 'PLN',
  chf: 'CHF', franc: 'CHF', франк: 'CHF',
  jpy: 'JPY', yen: 'JPY', єна: 'JPY', ієна: 'JPY',
  cny: 'CNY', yuan: 'CNY', юань: 'CNY',
  cad: 'CAD', aud: 'AUD', czk: 'CZK', try: 'TRY',
};

export function convertCurrency(rates: Record<string, number>, from: string, to: string, amount: number): number {
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate || !Number.isFinite(amount)) return Number.NaN;
  return (amount / fromRate) * toRate;
}

export interface RatesPayload {
  base: string;
  date: string;
  rates: Record<string, number>;
  live: boolean;
}

/**
 * Seam for a live rates provider. Set `VITE_RATES_ENDPOINT` and NOVA will use
 * it; without it the built-in reference table is returned.
 */
export async function fetchRates(signal?: AbortSignal): Promise<RatesPayload> {
  const endpoint = import.meta.env.VITE_RATES_ENDPOINT as string | undefined;
  const fallback: RatesPayload = { base: 'USD', date: REFERENCE_DATE, rates: referenceRates, live: false };
  if (!endpoint) return fallback;

  try {
    const response = await fetch(endpoint, { signal });
    if (!response.ok) return fallback;
    const payload = (await response.json()) as { base?: string; date?: string; rates?: Record<string, number> };
    if (!payload?.rates || typeof payload.rates !== 'object') return fallback;
    return {
      base: payload.base ?? 'USD',
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      rates: { USD: 1, ...payload.rates },
      live: true,
    };
  } catch {
    return fallback;
  }
}
