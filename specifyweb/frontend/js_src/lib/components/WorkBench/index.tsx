import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useUnloadProtect } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import { useMenuItem } from '../Header/MenuContext';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { Portal } from '../Molecules/Portal';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from '../WbPlanView/Wrapped';
import type { WbStatus } from './WbView';
import { WbView as WbViewClass, WbViewReact } from './WbView';
import { DataSetName } from './DataSetMeta';
import { WbSpreadsheet } from './WbSpreadsheet';
import Handsontable from 'handsontable';

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
  const [refresh, setRefresh] = React.useState<number>(0);

  const navigate = useNavigate();
  const hotRef = React.useRef(null);

  // temporary null check, replace with loading screen?
  if (!dataSet || !treeRanksLoaded) return null;

  const triggerRefresh = () => {
    setRefresh((previous) => previous + 1);
  }

  React.useEffect(() => {
    loading(fetchDataSet(dataSet!.id).then(setDataSet));
  }, [refresh]);

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
        <section className={`wbs-form ${className.containerFull}`}>
          <WbViewReact
            dataset={dataSet}
            hotRef={hotRef}
            handleDatasetDelete={handleDeleted}
            triggerRefresh={triggerRefresh}
          />
        </section>
      </div>
    </>
  );
}
