import Papa from 'papaparse';
import ImportXLSWorker from 'worker-loader!./wbimportxls.worker';

import { ajax } from './ajax';
import { Http } from './ajaxUtils';
import type { Dataset } from './components/wbplanview';
import { f } from './functools';
import { wbText } from './localization/workbench';
import { schema } from './schema';
import type { IR, RA } from './types';
import { uniquifyHeaders } from './wbplanviewheaderhelper';
import { uniquifyDataSetName } from './wbuniquifyname';

/** Remove the extension from the file name */
export const extractFileName = (fileName: string): string =>
  fileName.replace(/\.[^.]*$/, '');

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
    schema.models.RecordSet.getField('name')!.length,
    dataSetMaxLength
  );

export function extractHeader(
  data: RA<RA<string>>,
  hasHeader: boolean
): { readonly rows: RA<RA<string>>; readonly header: RA<string> } {
  const header = hasHeader
    ? uniquifyHeaders(data[0].map(f.trim))
    : Array.from(data[0], (_, index) => wbText('columnName', index + 1));
  const rows = hasHeader ? data.slice(1) : data;
  return { rows, header: Array.from(header) };
}

export const parseCsv = async (
  file: File,
  encoding: string,
  limit?: number
): Promise<RA<RA<string>>> =>
  new Promise((resolve, reject) =>
    Papa.parse(file, {
      encoding,
      preview: limit,
      skipEmptyLines: true,
      complete: ({ data, errors }) => {
        const rows = data as RA<RA<string>>;
        const maxWidth = Math.max(...rows.map((row) => row.length));
        /*
         * If rows were returned, despite an error, then the error is probably
         * not critical
         */
        if (errors.length > 0 && rows.length === 0)
          reject(new Error(errors.map(({ message }) => message).join('. ')));
        else if (maxWidth === 0 || rows.length === 0)
          reject(new Error(wbText('corruptFile', file.name)));
        else
          resolve(
            rows.map((row) => [
              ...row,
              ...Array.from({ length: maxWidth - row.length }).fill(''),
            ])
          );
      },
    })
  );

export const parseXls = async (
  file: File,
  limit?: number
): Promise<RA<RA<string>>> =>
  new Promise((resolve, reject) => {
    const worker = new ImportXLSWorker();
    worker.postMessage({ file, previewSize: limit });
    worker.addEventListener('message', ({ data }) => {
      const rows = data as RA<RA<string>>;
      if (rows.length === 0 || rows[0].length === 0)
        reject(new Error(wbText('corruptFile', file.name)));
      else resolve(rows);
    });
    worker.addEventListener('error', (error) =>
      reject(new Error(error.message))
    );
  });

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
      return ajax<Dataset>(
        '/api/workbench/dataset/',
        {
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
        },
        { expectedResponseCodes: [Http.CREATED] }
      );
    })
    .then(({ data }) => data);
