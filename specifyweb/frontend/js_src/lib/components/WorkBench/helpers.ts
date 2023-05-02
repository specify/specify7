import { stringify } from 'csv-stringify/browser/esm';

import { downloadFile } from '../Molecules/FilePicker';
import type { Dataset } from '../WbPlanView/Wrapped';
import { userPreferences } from '../Preferences/userPreferences';

export const downloadDataSet = async ({
  name,
  rows,
  columns,
}: Dataset): Promise<void> =>
  new Promise((resolve, reject) =>
    stringify(
      [columns, ...rows],
      {
        delimiter: userPreferences.get(
          'workBench',
          'editor',
          'exportFileDelimiter'
        ),
      },
      (error, output) => {
        if (error === undefined)
          resolve(
            downloadFile(name.endsWith('.csv') ? name : `${name}.tsv`, output)
          );
        else reject(error);
      }
    )
  );
