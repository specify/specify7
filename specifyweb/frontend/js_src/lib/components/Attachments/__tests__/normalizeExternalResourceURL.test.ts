import {
  MAX_EXTERNAL_RESOURCE_URL_LENGTH,
  normalizeExternalResourceURL,
} from '../attachments';

describe('normalizeExternalResourceURL', () => {
  test.each([
    ['https://example.org/resource', 'https://example.org/resource'],
    [' http://example.org/resource ', 'http://example.org/resource'],
    ['javascript:alert(1)', undefined],
    ['/relative/path', undefined],
    ['not a URL', undefined],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeExternalResourceURL(input)).toBe(expected);
  });

  test('accepts normalized URLs at the field limit', () => {
    const prefix = 'https://example.org/';
    const input = `${prefix}${'a'.repeat(
      MAX_EXTERNAL_RESOURCE_URL_LENGTH - prefix.length
    )}`;

    expect(normalizeExternalResourceURL(input)).toHaveLength(
      MAX_EXTERNAL_RESOURCE_URL_LENGTH
    );
  });

  test('rejects URLs that exceed the field limit after normalization', () => {
    const input = `https://example.org/${'a '.repeat(502)}`;

    expect(input.length).toBeLessThanOrEqual(MAX_EXTERNAL_RESOURCE_URL_LENGTH);
    expect(normalizeExternalResourceURL(input)).toBeUndefined();
  });
});
