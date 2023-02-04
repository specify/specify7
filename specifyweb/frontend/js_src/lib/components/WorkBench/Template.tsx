/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
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
import { useMenuItem } from '../Header';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { Portal } from '../Molecules/Portal';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WBView } from './wbView';

function Navigation({
  name,
  label,
}: {
  readonly name: string;
  readonly label: LocalizedString;
}): JSX.Element {
  return (
    <span
      aria-atomic
      className="wb-navigation-section flex rounded"
      data-navigation-type={name}
    >
      <Button.Small
        className="wb-cell-navigation p-2 ring-0 brightness-80 hover:brightness-70"
        data-navigation-direction="previous"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={f.never}
      >
        {'<'}
      </Button.Small>
      <Button.Small
        className={`
          wb-navigation-text aria-handled grid grid-cols-[auto_1fr_auto_1fr_auto] items-center
          ring-0 hover:brightness-70
        `}
        title={wbText.clickToToggle()}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={f.never}
      >
        {label} (<span className="wb-navigation-position text-center">0</span>/
        <span className="wb-navigation-total">0</span>)
      </Button.Small>
      <Button.Small
        className="wb-cell-navigation p-2 ring-0 brightness-80 hover:brightness-70"
        data-navigation-direction="next"
        type="button"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        onClick={f.never}
      >
        {'>'}
      </Button.Small>
    </span>
  );
}

function WbView({
  isUploaded,
  isMapped,
  dataSetId,
}: {
  readonly isUploaded: boolean;
  readonly isMapped: boolean;
  readonly dataSetId: number;
}): JSX.Element {
  const canUpdate = hasPermission('/workbench/dataset', 'update');
  return (
    <>
      <div
        className="flex items-center justify-between gap-x-1 gap-y-2 whitespace-nowrap"
        role="toolbar"
      >
        <div className="wb-name-container contents" />
        <Button.Small
          aria-haspopup="grid"
          aria-pressed="false"
          className="wb-show-toolkit"
          onClick={f.never}
        >
          {commonText.tools()}
        </Button.Small>
        <span className="-ml-1 flex-1" />
        {/* This button is here for debugging only */}
        <Button.Small
          className={`
            wb-show-plan
            ${process.env.NODE_ENV === 'development' ? '' : 'hidden'}
          `}
          onClick={f.never}
        >
          [DEV] Show Plan
        </Button.Small>
        {canUpdate || isMapped ? (
          <Link.Small href={`/specify/workbench/plan/${dataSetId}/`}>
            {wbPlanText.dataMapper()}
          </Link.Small>
        ) : undefined}
        {!isUploaded && hasPermission('/workbench/dataset', 'validate') && (
          <Button.Small
            aria-haspopup="dialog"
            className="wb-validate"
            onClick={undefined}
          >
            {wbText.validate()}
          </Button.Small>
        )}
        <Button.Small
          aria-haspopup="tree"
          className="wb-show-upload-view"
          title={wbText.wbUploadedUnavailable()}
          onClick={undefined}
        >
          {commonText.results()}
        </Button.Small>
        {isUploaded ? (
          hasPermission('/workbench/dataset', 'unupload') && (
            <Button.Small
              aria-haspopup="dialog"
              className="wb-unupload"
              onClick={f.never}
            >
              {wbText.rollback()}
            </Button.Small>
          )
        ) : (
          <>
            {hasPermission('/workbench/dataset', 'upload') && (
              <Button.Small
                aria-haspopup="dialog"
                className="wb-upload"
                onClick={f.never}
              >
                {wbText.upload()}
              </Button.Small>
            )}
            {hasPermission('/workbench/dataset', 'update') && (
              <>
                <Button.Small
                  aria-haspopup="dialog"
                  className="wb-revert"
                  onClick={undefined}
                >
                  {wbText.revert()}
                </Button.Small>
                <Button.Small
                  aria-haspopup="dialog"
                  className="wb-save"
                  onClick={undefined}
                >
                  {commonText.save()}
                </Button.Small>
              </>
            )}
          </>
        )}
      </div>
      <div
        aria-label={commonText.tools()}
        className="wb-toolkit flex flex-wrap gap-x-1 gap-y-2"
        role="toolbar"
        style={{ display: 'none' }}
      >
        {hasPermission('/workbench/dataset', 'transfer') &&
        hasTablePermission('SpecifyUser', 'read') ? (
          <Button.Small
            aria-haspopup="dialog"
            className="wb-change-data-set-owner"
            onClick={f.never}
          >
            {wbText.changeOwner()}
          </Button.Small>
        ) : undefined}
        <Button.Small className="wb-export-data-set" onClick={f.never}>
          {commonText.export()}
        </Button.Small>
        <span className="-ml-1 flex-1" />
        {hasPermission('/workbench/dataset', 'update') && (
          <>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-convert-coordinates"
              title={wbText.unavailableWithoutLocality()}
              onClick={undefined}
            >
              {wbText.convertCoordinates()}
            </Button.Small>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-geolocate"
              title={wbText.unavailableWithoutLocality()}
              onClick={undefined}
            >
              {localityText.geoLocate()}
            </Button.Small>
          </>
        )}
        <Button.Small
          aria-haspopup="dialog"
          className="wb-leafletmap"
          title={wbText.unavailableWithoutLocality()}
          onClick={undefined}
        >
          {localityText.geoMap()}
        </Button.Small>
      </div>
      <div className="flex flex-1 gap-4 overflow-hidden">
        <section className="wb-spreadsheet flex-1 overflow-hidden overscroll-none" />
        <aside aria-live="polite" className="wb-uploaded-view-wrapper hidden" />
      </div>
      <div
        aria-label={wbText.navigation()}
        className="flex flex-wrap justify-end gap-x-1 gap-y-2"
        role="toolbar"
      >
        <span className="contents" role="search">
          <div className="flex">
            <Input.Generic
              aria-label={commonText.searchQuery()}
              autoComplete="on"
              className="wb-search-query"
              placeholder={commonText.search()}
              spellCheck
              title={commonText.searchQuery()}
              type="search"
            />
          </div>
          {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
            <div className="flex">
              <Input.Text
                aria-label={wbText.replacementValue()}
                autoComplete="on"
                className="wb-replace-value"
                placeholder={wbText.replace()}
                title={wbText.replacementValue()}
              />
            </div>
          ) : undefined}
          <span className="wb-advanced-search-wrapper" />
        </span>
        <Navigation label={wbText.searchResults()} name="searchResults" />
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <Navigation label={wbText.modifiedCells()} name="modifiedCells" />
        ) : undefined}
        <Navigation label={wbText.newCells()} name="newCells" />
        {!isUploaded && (
          <Navigation label={wbText.errorCells()} name="invalidCells" />
        )}
      </div>
    </>
  );
}

export const wbViewTemplate = (
  isUploaded: boolean,
  isMapped: boolean,
  dataSetId: number
): string =>
  ReactDOMServer.renderToStaticMarkup(
    <WbView dataSetId={dataSetId} isMapped={isMapped} isUploaded={isUploaded} />
  );

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

export function WorkBench(): JSX.Element | null {
  useMenuItem('workBench');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  const { id } = useParams();
  const dataSetId = f.parseInt(id);

  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [dataSet, setDataSet] = useDataSet(dataSetId);
  useErrorContext('dataSet', dataSet);
  const loading = React.useContext(LoadingContext);
  const [isDeleted, handleDeleted] = useBooleanState();
  const [isDeletedConfirmation, handleDeletedConfirmation] = useBooleanState();
  const portals = useWbView(
    dataSet,
    treeRanksLoaded,
    container,
    handleDeleted,
    handleDeletedConfirmation,
    () => loading(fetchDataSet(dataSet!.id).then(setDataSet))
  );

  const navigate = useNavigate();
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
      <div className="contents" ref={setContainer} />
      {portals.map((portal, index) =>
        portal === undefined ? undefined : (
          <Portal element={portal.element} key={index}>
            {portal.jsx}
          </Portal>
        )
      )}
    </>
  );
}

// BUG: intercept 403 (if dataset has been transferred to another user)
function useDataSet(
  dataSetId: number | undefined
): GetSet<Dataset | undefined> {
  return useAsyncState(
    React.useCallback(async () => fetchDataSet(dataSetId), [dataSetId]),
    true
  );
}

const fetchDataSet = async (
  dataSetId: number | undefined
): Promise<Dataset | undefined> =>
  typeof dataSetId === 'number'
    ? ajax<Dataset>(`/api/workbench/dataset/${dataSetId}/`, {
        headers: { Accept: 'application/json' },
      }).then(({ data }) => data)
    : undefined;

function useWbView(
  dataSet: Dataset | undefined,
  treeRanksLoaded: boolean,
  container: HTMLElement | null,
  handleDeleted: () => void,
  handleDeletedConfirmation: () => void,
  handleRefresh: () => void
): RA<
  | { readonly jsx: JSX.Element; readonly element: HTMLElement | undefined }
  | undefined
> {
  const [portals, setPortals] = React.useState<
    RA<
      | { readonly jsx: JSX.Element; readonly element: HTMLElement | undefined }
      | undefined
    >
  >([]);

  const mode = React.useRef<string | undefined>(undefined);
  const wasAborted = React.useRef<boolean>(false);

  const [hasUnloadProtect, setUnloadProtect] = React.useState<boolean>(false);
  useUnloadProtect(hasUnloadProtect, wbText.wbUnloadProtect());

  React.useEffect(() => {
    if (!treeRanksLoaded || container === null || dataSet === undefined)
      return undefined;
    const contained = document.createElement('section');
    contained.setAttribute('class', `wbs-form ${className.containerFull}`);
    container.append(contained);
    const view = new WBView({
      el: contained,
      dataset: dataSet,
      refreshInitiatedBy: mode.current,
      refreshInitiatorAborted: wasAborted.current,
      onSetUnloadProtect: setUnloadProtect,
      onDeleted: handleDeleted,
      onDeletedConfirmation: handleDeletedConfirmation,
      display(
        jsx: JSX.Element,
        element?: HTMLElement,
        destructor?: () => void
      ) {
        let index = 0;
        setPortals((portals) => {
          index = portals.length;
          return [...portals, { jsx, element }];
        });
        return () => {
          setPortals((portals) => replaceItem(portals, index, undefined));
          destructor?.();
        };
      },
    })
      .on('refresh', (newMode: string | undefined, newWasAborted = false) => {
        setUnloadProtect(false);
        mode.current = newMode;
        wasAborted.current = newWasAborted;
        handleRefresh();
      })
      .render();
    return () => view.remove();
  }, [treeRanksLoaded, container, dataSet]);

  return portals;
}
