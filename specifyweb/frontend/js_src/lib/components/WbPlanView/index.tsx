/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';
import { useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import { useMenuItem } from '../Header/useMenuItem';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { hasPermission } from '../Permissions/helpers';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from './Wrapped';
import { WbPlanView } from './Wrapped';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

/**
 * Entrypoint React component for the workbench mapper
 */
export function WbPlanViewWrapper(): JSX.Element | null {
  const { id = '' } = useParams();
  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  useMenuItem('workBench');

  const [dataSet] = useAsyncState<Dataset | false>(
    React.useCallback(async () => {
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

  // const updateDataSetColumns = (lines: RA<MappingLine>) => {
  //   if (typeof dataSet === 'object') {
  //     overwriteReadOnly(
  //       dataSet,
  //       'columns',
  //       dataSet.columns.filter((column) =>
  //         lines.some((line) => line.headerName === column)
  //       )
  //     );
  //   }
  // };

  /*
   * Const updateDataSetColumns = (lines: RA<MappingLine>) => {
   *   if (typeof dataSet === 'object') {
   *     const dataSetId = dataSet.id;
   *     const url = `/api/workbench/dataset/${dataSetId}/`;
   */

  /*
   *     OverwriteReadOnly(
   *       dataSet,
   *       'columns',
   *       dataSet.columns.filter((column) =>
   *         lines.some((line) => line.headerName === column)
   *       )
   *     );
   *     const requestBody = {
   *       dataSet,
   *     };
   */

  /*
   *     Ajax(url, {
   *       method: 'PUT',
   *       headers: { 'Content-Type': 'application/json' },
   *       body: JSON.stringify(requestBody),
   *     });
   *   }
   * };
   */

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
      // updateDataSetColumns={updateDataSetColumns}
      uploadPlan={dataSet.uploadplan}
    />
  ) : null;
}
