import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HotTable } from '@handsontable/react';

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
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbViewReact } from './WbView';

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

const fetchDataSet = async (
  dataSetId: number | undefined
): Promise<Dataset | undefined> =>
  typeof dataSetId === 'number'
    ? ajax<Dataset>(`/api/workbench/dataset/${dataSetId}/`, {
        headers: { Accept: 'application/json' },
      }).then(({ data }) => data)
    : undefined;

// BUG: intercept 403 (if dataset has been transferred to another user)
function useDataSet(
  dataSetId: number | undefined
): GetSet<Dataset | undefined> {
  return useAsyncState(
    React.useCallback(async () => fetchDataSet(dataSetId), [dataSetId]),
    true
  );
}

export function WorkBenchReact(): JSX.Element | null {
  useMenuItem('workBench');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  const { id } = useParams();
  const dataSetId = f.parseInt(id);

  const [dataSet, setDataSet] = useDataSet(dataSetId);
  useErrorContext('dataSet', dataSet);
  const loading = React.useContext(LoadingContext);
  const [isDeleted, handleDeleted] = useBooleanState();
  const [isDeletedConfirmation, handleDeletedConfirmation] = useBooleanState();

  const navigate = useNavigate();
  const hotRef = React.useRef<HotTable>(null);
  const spreadsheetContainer = React.useRef<HTMLElement | null>(null);

  // temporary null check, replace with loading screen?
  if (!dataSet || !treeRanksLoaded) return null;

  const triggerRefresh = () => {
    loading(fetchDataSet(dataSet!.id).then(setDataSet));
  };

  return dataSetId === undefined ? (
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
    <>
      <div className="contents">
        <section className={`wbs-form ${className.containerFull}`} ref={spreadsheetContainer}>
          <WbViewReact
            dataset={dataSet}
            hotRef={hotRef}
            handleDatasetDelete={handleDeleted}
            triggerRefresh={triggerRefresh}
            spreadsheetContainer={spreadsheetContainer}
          />
        </section>
      </div>
    </>
  );
}
