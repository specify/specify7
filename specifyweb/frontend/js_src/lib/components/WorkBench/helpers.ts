import { stringify } from 'csv-stringify/browser/esm';

import type { RA } from '../../utils/types';
import { downloadFile } from '../Molecules/FilePicker';

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
          resolve(
            downloadFile(name.endsWith('.csv') ? name : `${name}.tsv`, output)
          );
        else reject(error);
      }
    )
  )