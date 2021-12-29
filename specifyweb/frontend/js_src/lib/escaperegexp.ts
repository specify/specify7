export const escapeRegExp = (string: string): string =>
  string.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
