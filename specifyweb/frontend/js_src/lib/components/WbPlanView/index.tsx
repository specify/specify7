/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { hasPermission } from '../Permissions/helpers';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from './Wrapped';
import { WbPlanView } from './Wrapped';
import { useParams } from 'react-router-dom';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Http } from '../../utils/ajax/definitions';
import { useMenuItem } from '../Header/useMenuItem';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

/**
 * Entrypoint React component for the workbench mapper
 */
export function WbPlanViewWrapper(): JSX.Element | null {
  const { id = '' } = useParams();
  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  useMenuItem('workBench');

  const [dataSet] = useAsyncState<Dataset | false>(
    React.useCallback(() => {
      const dataSetId = f.parseInt(id);
      if (dataSetId === undefined) return false;
      return ajax<Dataset>(
        `/api/workbench/dataset/${dataSetId}/`,
        {
          headers: { Accept: 'application/json' },
        },
        { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
      ).then(({ data, status }) => (status === Http.NOT_FOUND ? false : data));
    }, [id]),
    true
  );
  useErrorContext('dataSet', dataSet);

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
