import { getCurrencySections } from '../src/utils/currencyOptions';

describe('getCurrencySections', () => {
  it('puts available common currencies first and sorts the full list by country', () => {
    const sections = getCurrencySections({
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 145,
      ZZZ: 1,
    });

    expect(sections[0].title).toBe('Most used');
    expect(sections[0].data.map(({ code }) => code)).toEqual([
      'USD',
      'EUR',
      'GBP',
      'JPY',
    ]);
    expect(sections[1].title).toBe('All currencies');
    expect(sections[1].data.map(({ country }) => country)).toEqual(
      [...sections[1].data.map(({ country }) => country)].sort((a, b) =>
        a.localeCompare(b, 'en'),
      ),
    );
    expect(sections[1].data.some(({ code }) => code === 'ZZZ')).toBe(false);
  });

  it('returns no sections when no known rates are available', () => {
    expect(getCurrencySections({ ZZZ: 1 })).toEqual([]);
  });
});
