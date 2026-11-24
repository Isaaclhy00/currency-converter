import {
  fetchCurrencyTrends,
  normalizeCurrencyTrends,
} from '../src/api/trends';

describe('normalizeCurrencyTrends', () => {
  it('calculates the direction and percent change for each currency', () => {
    const trends = normalizeCurrencyTrends(
      [
        { base: 'USD', quote: 'EUR', date: '2026-11-14', rate: 1 },
        { base: 'USD', quote: 'GBP', date: '2026-11-14', rate: 1 },
        { base: 'USD', quote: 'JPY', date: '2026-11-14', rate: 100 },
        { base: 'USD', quote: 'EUR', date: '2026-11-21', rate: 1.1 },
        { base: 'USD', quote: 'GBP', date: '2026-11-21', rate: 0.9 },
        { base: 'USD', quote: 'JPY', date: '2026-11-21', rate: 100 },
      ],
      'USD',
      ['EUR', 'GBP', 'JPY'],
    );

    expect(trends.EUR.direction).toBe('up');
    expect(trends.EUR.changePercent).toBeCloseTo(10);
    expect(trends.GBP.direction).toBe('down');
    expect(trends.GBP.changePercent).toBeCloseTo(-10);
    expect(trends.JPY).toEqual({ direction: 'flat', changePercent: 0 });
  });

  it('ignores historical currencies that are not available in the app', () => {
    expect(
      normalizeCurrencyTrends(
        [
          { base: 'USD', quote: 'EUR', date: '2026-11-14', rate: 0.9 },
          { base: 'USD', quote: 'EUR', date: '2026-11-21', rate: 0.91 },
          { base: 'USD', quote: 'GBP', date: '2026-11-21', rate: 0.75 },
        ],
        'USD',
        ['EUR'],
      ),
    ).toEqual({
      EUR: { direction: 'up', changePercent: expect.any(Number) },
    });
  });

  it('does not infer a trend from a single historical observation', () => {
    expect(
      normalizeCurrencyTrends(
        [{ base: 'USD', quote: 'EUR', date: '2026-11-21', rate: 0.91 }],
        'USD',
        ['EUR'],
      ),
    ).toEqual({});
  });
});

describe('fetchCurrencyTrends', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('requests one seven-day historical range for the selected base', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-21T12:00:00Z'));
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { base: 'USD', quote: 'EUR', date: '2026-11-14', rate: 0.9 },
        { base: 'USD', quote: 'EUR', date: '2026-11-21', rate: 0.91 },
        { base: 'USD', quote: 'JPY', date: '2026-11-14', rate: 150 },
        { base: 'USD', quote: 'JPY', date: '2026-11-21', rate: 151 },
      ],
    } as Response);

    await expect(fetchCurrencyTrends('USD', ['EUR', 'JPY'])).resolves.toHaveProperty(
      'EUR',
    );

    const requestUrl = new URL(String(jest.mocked(fetch).mock.calls[0][0]));
    expect(requestUrl.origin).toBe('https://api.frankfurter.dev');
    expect(requestUrl.searchParams.get('base')).toBe('USD');
    expect(requestUrl.searchParams.has('quotes')).toBe(false);
    expect(requestUrl.searchParams.get('from')).toBe('2026-11-14');
    expect(requestUrl.searchParams.get('to')).toBe('2026-11-21');
  });

  it('returns empty trends without a request when no quote currencies are supplied', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    await expect(fetchCurrencyTrends('USD', [])).resolves.toEqual({});
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
