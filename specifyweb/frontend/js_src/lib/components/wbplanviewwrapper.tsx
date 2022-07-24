/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import { ajax, Http } from '../ajax';
import { f } from '../functools';
import { hasPermission } from '../permissionutils';
import { treeRanksPromise } from '../treedefinitions';
import { useAsyncState } from './hooks';
import { NotFoundView } from './notfoundview';
import type { Dataset } from './wbplanview';
import { WbPlanView } from './wbplanview';
import { useParams } from 'react-router-dom';
import { useMenuItem } from './header';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

/**
 * Entrypoint React component for the workbench mapper
 */
export function WbPlanViewWrapper(): JSX.Element | null {
  const { id = '' } = useParams();
  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  useMenuItem('workBench');

  const [dataSet] = useAsyncState<Dataset | false>(
    React.useCallback(
      () =>
        f.maybe(f.parseInt(id), async (dataSetId) =>
          ajax<Dataset>(
            `/api/workbench/dataset/${dataSetId}/`,
            {
              headers: { Accept: 'application/json' },
            },
            { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
          ).then(({ data, status }) =>
            status === Http.NOT_FOUND ? false : data
          )
        ) ?? false,
      [id]
    ),
    true
  );

  return dataSet === false ? (
    <NotFoundView />
  ) : treeRanksLoaded && typeof dataSet === 'object' ? (
    <WbPlanView
      dataset={dataSet}
      headers={
        dataSet.visualorder === null
          ? dataSet.columns
          : dataSet.visualorder.map(
              (physicalCol) => dataSet.columns[physicalCol]
            )
      }
      // Reorder headers if needed
      isReadOnly={
        (!hasPermission('/workbench/dataset', 'update') ||
          dataSet.uploadresult?.success) ??
        false
      }
      uploadPlan={dataSet.uploadplan}
    />
  ) : null;
}
