import { fetchRateHistory, normalizeRateHistory } from '../src/api/history';

describe('normalizeRateHistory', () => {
  it('sorts rate points in ascending date order', () => {
    expect(
      normalizeRateHistory(
        [
          { base: 'USD', quote: 'EUR', date: '2026-11-03', rate: 0.91 },
          { base: 'USD', quote: 'EUR', date: '2026-11-01', rate: 0.9 },
        ],
        'USD',
        'EUR',
      ),
    ).toEqual([
      { date: '2026-11-01', rate: 0.9 },
      { date: '2026-11-03', rate: 0.91 },
    ]);
  });

  it('rejects empty or mismatched history', () => {
    expect(() => normalizeRateHistory([], 'USD', 'EUR')).toThrow('no data');
    expect(() =>
      normalizeRateHistory(
        [{ base: 'USD', quote: 'GBP', date: '2026-11-01', rate: 0.8 }],
        'USD',
        'EUR',
      ),
    ).toThrow('does not match');
  });
});

describe('fetchRateHistory', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests a filtered time series for one currency pair', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { base: 'USD', quote: 'EUR', date: '2026-11-20', rate: 0.91 },
      ],
    } as Response);

    await expect(fetchRateHistory('USD', 'EUR')).resolves.toEqual([
      { date: '2026-11-20', rate: 0.91 },
    ]);

    const requestUrl = new URL(String(jest.mocked(fetch).mock.calls[0][0]));
    expect(requestUrl.origin).toBe('https://api.frankfurter.dev');
    expect(requestUrl.searchParams.get('base')).toBe('USD');
    expect(requestUrl.searchParams.get('quotes')).toBe('EUR');
    const from = new Date(`${requestUrl.searchParams.get('from')}T00:00:00Z`);
    const to = new Date(`${requestUrl.searchParams.get('to')}T00:00:00Z`);
    expect((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)).toBe(30);
  });

  it('returns a flat identity history without making a request', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    const points = await fetchRateHistory('USD', 'USD');

    expect(points).toHaveLength(31);
    expect(points.every(({ rate }) => rate === 1)).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
