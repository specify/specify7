import type { RA } from '../../utils/types';

type CatalogToken = number | '-';

export const parseCatalogNumberEntries = (rawEntries: string): RA<string> =>
  rawEntries
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const tokenizeCatalogEntry = (entry: string): RA<CatalogToken> => {
  const tokens: readonly CatalogToken[] = [];
  let currentNumber = '';

  for (const character of entry) {
    if (character >= '0' && character <= '9') {
      currentNumber += character;
      continue;
    }

    if (currentNumber.length > 0) {
      tokens.push(Number(currentNumber));
      currentNumber = '';
    }

    if (character === '-') tokens.push('-');
  }

  if (currentNumber.length > 0) tokens.push(Number(currentNumber));
  return tokens;
};

export const parseCatalogNumberRanges = (
  entries: RA<string>
): RA<readonly [number, number]> =>
  entries.flatMap((entry) => {
    const tokens = tokenizeCatalogEntry(entry);
    const ranges: readonly (readonly [number, number])[] = [];
    let index = 0;
    while (index < tokens.length) {
      const token = tokens[index];
      if (token === '-') {
        index += 1;
        continue;
      }

      let start = token;
      let end = start;
      const rangeEndToken = tokens[index + 2];
      if (tokens[index + 1] === '-' && typeof rangeEndToken === 'number') {
        end = rangeEndToken;
        index += 3;
      } else index += 1;

      if (start > end) [start, end] = [end, start];
      ranges.push([start, end]);
    }
    return ranges;
  });
