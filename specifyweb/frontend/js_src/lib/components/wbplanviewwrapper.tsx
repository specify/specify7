/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import { ajax, Http } from '../ajax';
import { f } from '../functools';
import wbText from '../localization/workbench';
import { NotFoundView } from '../notfoundview';
import { hasPermission } from '../permissions';
import { treeRanksPromise } from '../treedefinitions';
import { useAsyncState, useUnloadProtect } from './hooks';
import createBackboneView from './reactbackboneextend';
import type { Dataset } from './wbplanview';
import { WbPlanView } from './wbplanview';

/**
 * Entrypoint React component for the workbench mapper
 */
function WbPlanViewWrapper({
  dataSetId,
}: {
  readonly dataSetId: string;
}): JSX.Element | null {
  const [treeRanks] = useAsyncState(
    React.useCallback(async () => treeRanksPromise, []),
    true
  );

  const [dataSet] = useAsyncState<Dataset | false>(
    React.useCallback(
      () =>
        f.maybe(f.parseInt(dataSetId), async (dataSetId) =>
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
      [dataSetId]
    ),
    true
  );

  const setHasUnloadProtect = useUnloadProtect(
    false,
    wbText('unloadProtectMessage')
  );

  return dataSet === false ? (
    <NotFoundView />
  ) : typeof treeRanks === 'object' && typeof dataSet === 'object' ? (
    <WbPlanView
      dataset={dataSet}
      uploadPlan={dataSet.uploadplan}
      // Reorder headers if needed
      headers={
        dataSet.visualorder === null
          ? dataSet.columns
          : dataSet.visualorder.map(
              (physicalCol) => dataSet.columns[physicalCol]
            )
      }
      isReadOnly={
        (!hasPermission('/workbench/dataset', 'update') ||
          dataSet.uploadresult?.success) ??
        false
      }
      removeUnloadProtect={(): void => setHasUnloadProtect(false)}
      setUnloadProtect={(): void => setHasUnloadProtect(true)}
    />
  ) : null;
}

export default createBackboneView(WbPlanViewWrapper);
