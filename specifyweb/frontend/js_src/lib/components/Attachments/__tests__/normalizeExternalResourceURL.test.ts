import { normalizeExternalResourceURL } from '../attachments';

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
});
