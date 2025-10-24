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
import { ReadOnlyContext } from '../Core/Contexts';
import { useMenuItem } from '../Header/MenuContext';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { NotFoundView } from '../Router/NotFoundView';
import { resolveVariantFromDataset } from '../WbUtils/datasetVariants';
import type { Dataset } from './Wrapped';
import { WbPlanView } from './Wrapped';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

export function WbPlanViewWrapper(): JSX.Element | null {
  const { id = '' } = useParams();
  const [dataSet] = useAsyncState<Dataset | false>(
    React.useCallback(async () => {
      const dataSetId = f.parseInt(id);
      if (dataSetId === undefined) return false;
      return ajax<Dataset>(`/api/workbench/dataset/${dataSetId}/`, {
        headers: { Accept: 'application/json' },
        expectedErrors: [Http.NOT_FOUND],
      }).then(({ data, status }) => (status === Http.NOT_FOUND ? false : data));
    }, [id]),
    true
  );
  return dataSet === false ? (
    <NotFoundView />
  ) : dataSet === undefined ? null : (
    <WbPlanViewSafe dataSet={dataSet} />
  );
}

/**
 * Entrypoint React component for the workbench mapper
 */
function WbPlanViewSafe({
  dataSet,
}: {
  readonly dataSet: Dataset;
}): JSX.Element | null {
  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  useMenuItem(dataSet.isupdate ? 'batchEdit' : 'workBench');
  useErrorContext('dataSet', dataSet);
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    !resolveVariantFromDataset(dataSet).canEdit() ||
    typeof dataSet !== 'object' ||
    dataSet.uploadresult?.success === true ||
    // FEATURE: Remove this
    dataSet.isupdate;

  return treeRanksLoaded && typeof dataSet === 'object' ? (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <WbPlanView
        readonlySpec={
          dataSet.isupdate
            ? { mustMatch: false, columnOptions: false, batchEditPrefs: false }
            : undefined
        }
        uploadPlan={dataSet.uploadplan}
        dataset={dataSet}
        // Reorder headers if needed
        headers={
          dataSet.visualorder === null
            ? dataSet.columns
            : dataSet.visualorder.map(
                (physicalCol) => dataSet.columns[physicalCol]
              )
        }
      />
    </ReadOnlyContext.Provider>
  ) : null;
}
