import { convert, getDecimalPlaces } from '../src/utils/convert';

describe('convert', () => {
  it('converts between currencies using USD-relative rates', () => {
    expect(convert(100, 1, 0.92, 'EUR')).toBe(92);
  });

  it('rounds currencies to two decimal places', () => {
    expect(convert(10, 1.25, 0.92, 'EUR')).toBe(7.36);
  });

  it('rounds JPY and KRW to zero decimal places', () => {
    expect(getDecimalPlaces('JPY')).toBe(0);
    expect(getDecimalPlaces('KRW')).toBe(0);
    expect(convert(1, 1, 145.25, 'JPY')).toBe(145);
  });

  it('supports zero amounts', () => {
    expect(convert(0, 1, 0.92, 'EUR')).toBe(0);
  });

  it('rejects invalid amounts', () => {
    expect(() => convert(-1, 1, 0.92, 'EUR')).toThrow(RangeError);
    expect(() => convert(Number.NaN, 1, 0.92, 'EUR')).toThrow(RangeError);
  });

  it('rejects invalid rates', () => {
    expect(() => convert(10, 0, 0.92, 'EUR')).toThrow(RangeError);
    expect(() => convert(10, 1, -1, 'EUR')).toThrow(RangeError);
  });
});
