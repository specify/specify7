/**
 * Makes WB headers unique
 *
 * @module
 */

import type { MappingLine } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import { wbText } from './localization/workbench';
import type { RA } from './types';
import { generateMappingPathPreview } from './wbplanviewmappingpreview';
import { getUniqueName } from './wbuniquifyname';

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
        : getUniqueName(header, headers)
    );

export function renameNewlyCreatedHeaders(
  baseTableName: keyof Tables,
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
