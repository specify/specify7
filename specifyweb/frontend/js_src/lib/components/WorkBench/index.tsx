import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { GetSet } from '../../utils/types';
import { className } from '../Atoms/className';
import { LoadingContext } from '../Core/Contexts';
import { useMenuItem } from '../Header/MenuContext';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { LoadingScreen } from '../Molecules/Dialog';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbView } from './WbView';

export function WorkBench(): JSX.Element {
  useMenuItem('workBench');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  const { id } = useParams();
  const datasetId = f.parseInt(id);

  const [dataset, setDataSet] = useDataSet(datasetId);
  useErrorContext('dataSet', dataset);
  const loading = React.useContext(LoadingContext);

  const [isDeleted, handleDeleted] = useBooleanState();
  // @ts-ignore figure out how handleDeletedConfirmation was being used in Backbone. possibly not used at all
  const [isDeletedConfirmation, handleDeletedConfirmation] = useBooleanState();

  const navigate = useNavigate();
  const spreadsheetContainerRef = React.useRef<HTMLElement>(null);

  if (dataset === undefined || !treeRanksLoaded) return <LoadingScreen />;

  const triggerDatasetRefresh = () => {
    loading(fetchDataSet(dataset.id).then(setDataSet));
  };

  return datasetId === undefined ? (
    <NotFoundView />
  ) : isDeleted ? (
    <>{wbText.dataSetDeletedOrNotFound()}</>
  ) : isDeletedConfirmation ? (
    <Dialog
      buttons={commonText.close()}
      header={wbText.dataSetDeleted()}
      onClose={(): void => navigate('/specify/', { replace: true })}
    >
      {wbText.dataSetDeletedDescription()}
    </Dialog>
  ) : (
    <div className="contents">
      <section
        className={`wbs-form ${className.containerFull}`}
        ref={spreadsheetContainerRef}
      >
        <WbView
          dataset={dataset}
          key={dataset.id}
          spreadsheetContainerRef={spreadsheetContainerRef}
          triggerDatasetRefresh={triggerDatasetRefresh}
          onDatasetDeleted={handleDeleted}
        />
      </section>
    </div>
  );
}

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

// BUG: intercept 403 (if dataset has been transferred to another user)
function useDataSet(
  datasetId: number | undefined
): GetSet<Dataset | undefined> {
  return useAsyncState(
    React.useCallback(async () => fetchDataSet(datasetId), [datasetId]),
    true
  );
}

const fetchDataSet = async (
  datasetId: number | undefined
): Promise<Dataset | undefined> =>
  typeof datasetId === 'number'
    ? ajax<Dataset>(`/api/workbench/dataset/${datasetId}/`, {
        headers: { Accept: 'application/json' },
      }).then(({ data }) => data)
    : undefined;
