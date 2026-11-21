import {
  fetchExchangeRates,
  normalizeFallbackResponse,
  normalizePrimaryResponse,
  PRIMARY_RATES_URL,
} from '../src/api/rates';

describe('rate response normalization', () => {
  it('normalizes the primary API response', () => {
    expect(
      normalizePrimaryResponse({
        date: '2026-11-21',
        usd: { eur: 0.92, jpy: 145.25 },
      }),
    ).toEqual({
      base: 'USD',
      date: '2026-11-21',
      rates: { EUR: 0.92, JPY: 145.25, USD: 1 },
    });
  });

  it('normalizes the fallback API response', () => {
    expect(
      normalizeFallbackResponse({
        base: 'USD',
        date: '2026-11-21',
        rates: { EUR: 0.92, JPY: 145.25 },
      }),
    ).toEqual({
      base: 'USD',
      date: '2026-11-21',
      rates: { EUR: 0.92, JPY: 145.25, USD: 1 },
    });
  });

  it('rejects empty rate data', () => {
    expect(() =>
      normalizePrimaryResponse({ date: '2026-11-21', usd: {} }),
    ).toThrow('no valid rates');
  });

  it('rejects malformed fallback responses', () => {
    expect(() => normalizeFallbackResponse(null)).toThrow('invalid format');
    expect(() =>
      normalizeFallbackResponse({
        base: 'USD',
        date: '2026-11-21',
        rates: { EUR: Number.NaN },
      }),
    ).toThrow('no valid rates');
  });
});

describe('fetchExchangeRates', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the primary API when available', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ date: '2026-11-21', usd: { eur: 0.92 } }),
    } as Response);

    await expect(fetchExchangeRates()).resolves.toMatchObject({
      base: 'USD',
      rates: { EUR: 0.92 },
    });
    expect(fetch).toHaveBeenCalledWith(PRIMARY_RATES_URL);
  });

  it('falls back to the secondary API', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          base: 'USD',
          date: '2026-11-21',
          rates: { EUR: 0.92 },
        }),
      } as Response);

    await expect(fetchExchangeRates()).resolves.toMatchObject({
      base: 'USD',
      rates: { EUR: 0.92 },
    });
  });

  it('reports failure when both APIs fail', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(fetchExchangeRates()).rejects.toThrow(
      'Unable to fetch exchange rates from any data source',
    );
  });
});
