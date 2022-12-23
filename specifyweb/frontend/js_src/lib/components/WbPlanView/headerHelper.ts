/**
 * Makes WB headers unique
 *
 * @module
 */

import { wbPlanText } from '../../localization/wbPlan';
import type { RA } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import type { Tables } from '../DataModel/types';
import type { MappingLine } from './Mapper';
import { generateMappingPathPreview } from './mappingPreview';

export function uniquifyHeaders(
  rawHeaders: RA<string>,
  headersToUniquify: RA<number> | false = false
): RA<string> {
  const headers = rawHeaders.map((header) =>
    header.trim().length === 0 ? wbPlanText.noHeader() : header
  );
  headers.forEach((header, index) => {
    if (
      headers.indexOf(header) === index ||
      (Array.isArray(headersToUniquify) && !headersToUniquify.includes(index))
    )
      return;
    headers[index] = getUniqueName(header, headers);
  });
  return headers;
}

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
