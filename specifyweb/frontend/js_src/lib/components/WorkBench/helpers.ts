import { stringify } from 'csv-stringify/browser/esm';

import type { RA } from '../../utils/types';
import { downloadFile } from '../Molecules/FilePicker';

const delimiterFileExtensions = new Map<string, string>([
  [',', 'csv'],
  [';', 'csv'],
  ['\t', 'tsv'],
  ['|', 'psv'],
  [' ', 'txt'],
]);

const knownDelimitedFileExtension = /\.(csv|psv|tsv|txt)$/iu;

export const getDelimitedFileName = (name: string, delimiter: string): string =>
  `${name.replace(knownDelimitedFileExtension, '')}.${
    delimiterFileExtensions.get(delimiter) ?? 'txt'
  }`;

export const downloadDataSet = async (
  name: string,
  rows: RA<RA<string>>,
  columns: RA<string>,
  delimiter: string,
  bom: boolean = false
): Promise<void> =>
  new Promise((resolve, reject) =>
    stringify(
      [columns, ...rows],
      {
        delimiter,
        bom,
      },
      (error, output) => {
        if (error === undefined)
          resolve(downloadFile(getDelimitedFileName(name, delimiter), output));
        else reject(error);
      }
    )
  );
