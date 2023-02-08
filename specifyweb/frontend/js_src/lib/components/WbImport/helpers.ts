import { parse } from 'csv-parse/browser/esm';
/**
 * REFACTOR: add this ESLint rule:
 *   https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-webpack-loader-syntax.md
 *   and update the usages in code to fix that rule
 */
import ImportXLSWorker from 'worker-loader!./xls.worker';

import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import { databaseDateFormat } from '../../utils/parser/dateConfig';
import { fullDateFormat } from '../../utils/parser/dateFormat';
import type { GetSet, IR, RA } from '../../utils/types';
import { uniquifyDataSetName } from '../../utils/uniquifyName';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import { fileToText } from '../Molecules/FilePicker';
import { uniquifyHeaders } from '../WbPlanView/headerHelper';
import type { Dataset } from '../WbPlanView/Wrapped';

/** Remove the extension from the file name */
export const extractFileName = (fileName: string): string =>
  fileName.replace(/\.[^.]*$/u, '');

export const wbImportPreviewSize = 100;

const fileMimeMapper: IR<'csv' | 'xls'> = {
  'text/csv': 'csv',
  'text/tab-separated-values': 'csv',
  'text/plain': 'csv',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template': 'xls',
  'application/vnd.ms-excel.sheet.macroEnabled.12': 'xls',
  'application/vnd.ms-excel.template.macroEnabled.12': 'xls',
  'application/vnd.ms-excel.addin.macroEnabled.12': 'xls',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12': 'xls',
};

export const inferDataSetType = (file: File): 'csv' | 'xls' =>
  fileMimeMapper[file.type] ??
  (file.name.toLowerCase().endsWith('.psv') ? 'csv' : 'xlsx');

/*
 * This is the maxLength of the SpDataSet.name field. Since that table
 * is not exposed to the front-end, can't get the name dynamically
 */
const dataSetMaxLength = 256;

export const getMaxDataSetLength = (): number | undefined =>
  f.min(
    /**
     * Since record set is automatically created from a Data Set name, need
     * to check the length limit in both places. See more:
     * https://github.com/specify/specify7/issues/1203
     */
    getField(schema.models.RecordSet, 'name').length,
    dataSetMaxLength
  );

export function extractHeader(
  data: RA<RA<string>>,
  hasHeader: boolean
): { readonly rows: RA<RA<string>>; readonly header: RA<string> } {
  const header = hasHeader
    ? uniquifyHeaders(data[0].map(f.trim))
    : Array.from(data[0], (_, index) =>
        wbText.columnName({ columnIndex: index + 1 })
      );
  const rows = hasHeader ? data.slice(1) : data;
  return { rows, header: Array.from(header) };
}

export const parseCsv = async (
  file: File,
  encoding: string,
  [delimiter, setDelimiter]: GetSet<string | undefined>,
  limit?: number
): Promise<RA<RA<string>>> =>
  fileToText(file, encoding).then(
    async (text) =>
      new Promise((resolve, reject) => {
        const resolvedDelimiter = delimiter ?? guessDelimiter(text);
        parse(
          text,
          {
            toLine: limit,
            skipEmptyLines: true,
            delimiter: resolvedDelimiter,
            // Allow variable number of columns
            relaxColumnCount: true,
            /*
             * Handle cases like this gracefully:
             * https://github.com/specify/specify7/issues/2150#issuecomment-1248288620
             */
            relaxQuotes: true,
          },
          (error, rows: RA<RA<string>> | undefined = []) => {
            if (delimiter !== resolvedDelimiter)
              setDelimiter(resolvedDelimiter);

            const maxWidth = Math.max(...rows.map((row) => row.length));
            /*
             * If rows were returned, despite an error, then the error is probably
             * not critical
             */
            if (typeof error === 'object') reject(error);
            else if (maxWidth === 0 || rows.length === 0)
              reject(new Error(wbText.corruptFile({ fileName: file.name })));
            else
              resolve(
                rows.map((row) => [
                  ...row,
                  ...Array.from({ length: maxWidth - row.length }).fill(''),
                ])
              );
          }
        );
      })
  );

export const parseXls = async (
  file: File,
  limit?: number
): Promise<RA<RA<string>>> =>
  new Promise((resolve, reject) => {
    const worker = new ImportXLSWorker();
    const dateFormat =
      fullDateFormat() === databaseDateFormat ? undefined : fullDateFormat();
    worker.postMessage({ file, previewSize: limit, dateFormat });
    worker.addEventListener('message', ({ data }) => {
      const rows = data as RA<RA<string>>;
      if (rows.length === 0 || rows[0].length === 0)
        reject(new Error(wbText.corruptFile({ fileName: file.name })));
      else resolve(rows);
    });
    worker.addEventListener('error', (error) =>
      reject(new Error(error.message))
    );
  });

// Ordered from the highest priority to the lowest priority
const possibleDelimiters = [',', '\t', '|', ';'];

/**
 * Predict the delimiter based on most common delimiter in the first line
 */
function guessDelimiter(text: string): string {
  const firstLine = text.split('\n')[0];
  return possibleDelimiters
    .map((delimiter) => [delimiter, firstLine.split(delimiter).length] as const)
    .reduce(
      ([currentDelimiter, currentMax], [delimiter, max]) =>
        max > currentMax ? [delimiter, max] : [currentDelimiter, currentMax],
      [',', 0]
    )[0];
}

export const createDataSet = async ({
  dataSetName,
  fileName,
  hasHeader,
  data,
}: {
  readonly dataSetName: string;
  readonly fileName: string;
  readonly hasHeader: boolean;
  readonly data: RA<RA<string>>;
}): Promise<Dataset> =>
  uniquifyDataSetName(dataSetName)
    .then(async (dataSetName) => {
      const { rows, header } = extractHeader(data, hasHeader);
      return ajax<Dataset>('/api/workbench/dataset/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: {
          name: dataSetName,
          importedfilename: fileName,
          columns: header,
          rows,
        },
        errorMode: 'dismissible',
        expectedResponseCodes: [Http.CREATED],
      });
    })
    .then(({ data }) => data);
