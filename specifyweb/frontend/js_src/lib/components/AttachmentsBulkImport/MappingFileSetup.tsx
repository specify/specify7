import React from 'react';
import { parse } from 'csv-parse/browser/esm';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import type { GetSet } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { FilePicker } from '../Molecules/FilePicker';
import type { MappingFileColumns, MappingFileRow } from './types';

/**
 * Parse a CSV file and return headers + data rows
 */
const parseMappingCsv = async (
  file: File
): Promise<{ headers: RA<string>; rows: RA<RA<string>> }> => {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    parse(
      text,
      {
        delimiter: [',', '\t', '|'],
        relaxColumnCount: true,
        skipEmptyLines: true,
        trim: true,
      },
      (error, data: RA<RA<string>>) => {
        if (error) {
          reject(error);
          return;
        }
        if (data.length === 0) {
          reject(new Error('Empty CSV file'));
          return;
        }
        const headers = data[0];
        const rows = data.slice(1).filter(
          (row) => row.some((cell) => cell.trim() !== '')
        );
        resolve({ headers, rows });
      }
    );
  });
};

/**
 * Attempt to auto-detect which columns are match value and file name
 * by looking at header names.
 */
function autoDetectColumns(headers: RA<string>): {
  matchValueIndex: number | undefined;
  fileNameIndex: number | undefined;
} {
  const matchValuePatterns = [
    /catalog\s*number/i,
    /cataloguenumber/i,
    /guid/i,
    /match\s*value/i,
    /identifier/i,
    /record\s*id/i,
    /barcode/i,
  ];
  const fileNamePatterns = [
    /attachment\s*name/i,
    /file\s*name/i,
    /filename/i,
    /attachment/i,
    /file/i,
  ];

  let matchValueIndex: number | undefined;
  let fileNameIndex: number | undefined;

  headers.forEach((header, index) => {
    if (
      matchValueIndex === undefined &&
      matchValuePatterns.some((p) => p.test(header))
    ) {
      matchValueIndex = index;
    }
    if (
      fileNameIndex === undefined &&
      fileNamePatterns.some((p) => p.test(header))
    ) {
      fileNameIndex = index;
    }
  });

  return { matchValueIndex, fileNameIndex };
}

export function MappingFileSetup({
  onColumnsSelected: handleColumnsSelected,
  disabled,
  initialColumns,
  initialData,
}: {
  readonly onColumnsSelected: (
    columns: MappingFileColumns,
    data: RA<MappingFileRow>
  ) => void;
  readonly disabled?: boolean;
  readonly initialColumns?: MappingFileColumns;
  readonly initialData?: RA<MappingFileRow>;
}): JSX.Element {
  const [file, setFile] = React.useState<File | undefined>(undefined);
  const [headers, setHeaders] = React.useState<RA<string> | undefined>(
    undefined
  );
  const [rows, setRows] = React.useState<RA<RA<string>> | undefined>(undefined);
  const [matchValueIndex, setMatchValueIndex] = React.useState<
    number | undefined
  >(initialColumns?.matchValueColumnIndex);
  const [fileNameIndex, setFileNameIndex] = React.useState<
    number | undefined
  >(initialColumns?.fileNameColumnIndex);
  const [error, setError] = React.useState<string | undefined>(undefined);

  // If initial data is provided (restoring from saved dataset), use it
  const isRestored = initialColumns !== undefined && initialData !== undefined;
  const [hasRestored] = React.useState(isRestored);

  const handleFileSelected = React.useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setError(undefined);
      try {
        const parsed = await parseMappingCsv(selectedFile);
        setHeaders(parsed.headers);
        setRows(parsed.rows);

        // Auto-detect columns
        const detected = autoDetectColumns(parsed.headers);
        if (detected.matchValueIndex !== undefined)
          setMatchValueIndex(detected.matchValueIndex);
        if (detected.fileNameIndex !== undefined)
          setFileNameIndex(detected.fileNameIndex);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to parse CSV file'
        );
      }
    },
    []
  );

  // Notify parent when columns are selected
  const previousMappingRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (
      matchValueIndex === undefined ||
      fileNameIndex === undefined ||
      rows === undefined
    )
      return;

    const mappingData: RA<MappingFileRow> = filterArray(
      rows.map((row) => {
        const matchValue = row[matchValueIndex]?.trim();
        const fileName = row[fileNameIndex]?.trim();
        if (matchValue === undefined || fileName === undefined) return undefined;
        if (matchValue === '' || fileName === '') return undefined;
        return { matchValue, fileName };
      })
    );

    const mappingKey = JSON.stringify({ matchValueIndex, fileNameIndex });
    if (mappingKey !== previousMappingRef.current) {
      previousMappingRef.current = mappingKey;
      handleColumnsSelected(
        {
          matchValueColumnIndex: matchValueIndex,
          fileNameColumnIndex: fileNameIndex,
        },
        mappingData
      );
    }
  }, [matchValueIndex, fileNameIndex, rows, handleColumnsSelected]);

  return (
    <div className="flex flex-col gap-3">
      {/* Show restored state */}
      {hasRestored && initialData !== undefined ? (
        <div className="flex flex-col gap-1 rounded border p-2">
          <div className="text-sm font-semibold">
            {attachmentsText.mappingFileLoaded({
              count: initialData.length,
            })}
          </div>
          <div className="text-xs text-gray-500">
            {attachmentsText.mappingFileColumnsInfo({
              matchColumn:
                headers?.[initialColumns?.matchValueColumnIndex ?? 0] ??
                String(initialColumns?.matchValueColumnIndex ?? 0),
              fileColumn:
                headers?.[initialColumns?.fileNameColumnIndex ?? 0] ??
                String(initialColumns?.fileNameColumnIndex ?? 0),
            })}
          </div>
        </div>
      ) : (
        <>
          <div className="w-full">
            <FilePicker
              acceptedFormats={['.csv', '.tsv', '.txt']}
              disabled={disabled}
              onFileSelected={handleFileSelected}
            />
          </div>
          {error !== undefined && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </>
      )}

      {/* Column selection */}
      {headers !== undefined && (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {attachmentsText.selectMatchValueColumn()}
            </span>
            <Select
              aria-label={attachmentsText.selectMatchValueColumn().toString()}
              className="w-full"
              disabled={disabled}
              value={matchValueIndex ?? ''}
              onValueChange={(value) =>
                setMatchValueIndex(
                  value === '' ? undefined : Number.parseInt(value)
                )
              }
            >
              <option disabled value="">
                {commonText.select()}
              </option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header || `Column ${index + 1}`}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {attachmentsText.selectFileNameColumn()}
            </span>
            <Select
              aria-label={attachmentsText.selectFileNameColumn().toString()}
              className="w-full"
              disabled={disabled}
              value={fileNameIndex ?? ''}
              onValueChange={(value) =>
                setFileNameIndex(
                  value === '' ? undefined : Number.parseInt(value)
                )
              }
            >
              <option disabled value="">
                {commonText.select()}
              </option>
              {headers.map((header, index) => (
                <option key={index} value={index}>
                  {header || `Column ${index + 1}`}
                </option>
              ))}
            </Select>
          </label>
        </div>
      )}
    </div>
  );
}
