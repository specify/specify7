import type { RA } from '../../utils/types';

type CatalogToken = number | '-';
const yearCatalogNumberDelimiters = '-/|._:; *$%#@';
const yearCatalogNumberDelimiterClass = yearCatalogNumberDelimiters.replaceAll(
  /[$()*+\-./?[\\\]^{|}]/g,
  '\\$&'
);
const entryYearCatalogNumberRe = new RegExp(
  `(?<!\\d)(?<year>\\d{4})[${yearCatalogNumberDelimiterClass}]+(?<number>\\d+)(?!\\d)`,
  'g'
);
const isPossibleCatalogYear = (year: number): boolean =>
  year >= 1000 && year <= 2999;

export const parseCatalogNumberEntries = (rawEntries: string): RA<string> =>
  rawEntries
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const tokenizeCatalogEntry = (entry: string): RA<CatalogToken> => {
  const tokens: CatalogToken[] = [];
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

const stripYearCatalogNumberMatches = (entry: string): string => {
  let segments = '';
  let cursor = 0;
  const yearMatches = Array.from(
    entry.matchAll(entryYearCatalogNumberRe)
  ).filter((match) => isPossibleCatalogYear(Number(match.groups?.year ?? '')));
  for (const match of yearMatches) {
    const start = match.index ?? 0;
    const matchedText = match[0];
    segments += entry.slice(cursor, start);
    segments += ' '.repeat(matchedText.length);
    cursor = start + matchedText.length;
  }
  segments += entry.slice(cursor);
  return segments;
};

export const parseCatalogNumberRanges = (
  entries: RA<string>
): RA<readonly [number, number]> =>
  entries.flatMap((entry) => {
    const ranges: Array<readonly [number, number]> = [];
    const yearMatches = Array.from(
      entry.matchAll(entryYearCatalogNumberRe)
    ).filter((match) =>
      isPossibleCatalogYear(Number(match.groups?.year ?? ''))
    );

    let yearMatchIndex = 0;
    while (yearMatchIndex < yearMatches.length) {
      const match = yearMatches[yearMatchIndex];
      let start = Number(match.groups?.number ?? '');
      let end = start;
      const nextMatch = yearMatches[yearMatchIndex + 1];
      if (
        typeof nextMatch?.index === 'number' &&
        Number(nextMatch.groups?.year ?? '') ===
          Number(match.groups?.year ?? '') &&
        entry
          .slice((match.index ?? 0) + match[0].length, nextMatch.index)
          .includes('-')
      ) {
        end = Number(nextMatch.groups?.number ?? '');
        yearMatchIndex += 1;
      }

      if (start > end) [start, end] = [end, start];
      ranges.push([start, end]);
      yearMatchIndex += 1;
    }

    const tokens = tokenizeCatalogEntry(stripYearCatalogNumberMatches(entry));
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
