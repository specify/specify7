import type { RA } from './types';
import type { MappingLine } from './components/wbplanviewmapper';
import wbText from './localization/workbench';
import { generateMappingPathPreview } from './wbplanviewmappingpreview';

const formatUniqueifiedHeader = (
  headers: RA<string>,
  header: string,
  initialIndex: number
): string =>
  `${header} (${
    initialIndex +
    (Array.from(Array.from({ length: 2 ** 10 }), (_, index) => index).find(
      (index) => !headers.includes(`${header} (${initialIndex + index})`)
    ) ?? 2 ** 10 + Math.floor(Math.random() * 2 ** 11))
  })`;

export const uniquifyHeaders = (
  headers: RA<string>,
  headersToUniquify: RA<number> | false = false
): RA<string> =>
  headers
    .map((header) => (header ? header : wbText('noHeader')))
    .map((header, index, headers) =>
      headers.indexOf(header) === index ||
      (Array.isArray(headersToUniquify) && !headersToUniquify.includes(index))
        ? header
        : formatUniqueifiedHeader(
            headers,
            header,
            headers
              .slice(0, index)
              .reduce(
                (numberOfOccurrences, headerOccurrence) =>
                  header === headerOccurrence
                    ? numberOfOccurrences + 1
                    : numberOfOccurrences,
                0
              ) + 1
          )
    );

export function renameNewlyCreatedHeaders(
  baseTableName: string,
  headers: RA<string>,
  lines: RA<MappingLine>
): RA<MappingLine> {
  const generatedHeaderPreviews = Object.fromEntries(
    lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => !headers.includes(line.headerName))
      .map(({ line, index }) => [
        index,
        generateMappingPathPreview(baseTableName, line.mappingPath),
      ])
  );

  const newHeaders = lines.map(
    ({ headerName }, index) => generatedHeaderPreviews[index] ?? headerName
  );

  const uniqueHeaders = uniquifyHeaders(
    newHeaders,
    Object.keys(generatedHeaderPreviews).map((index) => Number.parseInt(index))
  );

  return lines.map((line, index) => ({
    ...line,
    headerName: uniqueHeaders[index],
  }));
}
