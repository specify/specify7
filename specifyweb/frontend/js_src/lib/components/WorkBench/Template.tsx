/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useParams } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { wbText } from '../../localization/workbench';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import type { GetSet } from '../../utils/types';
import { WBView } from './wbView';
import { LoadingContext } from '../Core/Contexts';
import { useMenuItem } from '../Header';
import { useUnloadProtect } from '../../hooks/navigation';
import { NotFoundView } from '../Router/NotFoundView';
import type { Dataset } from '../WbPlanView/Wrapped';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Input } from '../Atoms/Form';
import { className } from '../Atoms/className';
import { useAsyncState } from '../../hooks/useAsyncState';
import { legacyDialogs } from '../Molecules/LegacyDialog';
import { LocalizedString } from 'typesafe-i18n';
import { wbPlanText } from '../../localization/wbPlan';

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
        {hasPermission('/workbench/dataset', 'delete') && (
          <Button.Small
            aria-haspopup="dialog"
            className="wb-delete-data-set"
            onClick={f.never}
          >
            {commonText.delete()}
          </Button.Small>
        )}
        <span className="-ml-1 flex-1" />
        {hasPermission('/workbench/dataset', 'update') && (
          <>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-convert-coordinates"
              onClick={undefined}
              title={wbText.unavailableWithoutLocality()}
            >
              {wbText.convertCoordinates()}
            </Button.Small>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-geolocate"
              onClick={undefined}
              title={wbText.unavailableWithoutLocality()}
            >
              {localityText.geoLocate()}
            </Button.Small>
          </>
        )}
        <Button.Small
          aria-haspopup="dialog"
          className="wb-leafletmap"
          onClick={undefined}
          title={wbText.unavailableWithoutLocality()}
        >
          {commonText.geoMap()}
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
    <WbView dataSetId={dataSetId} isUploaded={isUploaded} isMapped={isMapped} />
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
  useWbView(dataSet, treeRanksLoaded, container, () =>
    loading(fetchDataSet(dataSet!.id).then(setDataSet))
  );

  return dataSetId === undefined ? (
    <NotFoundView />
  ) : (
    <div className="contents" ref={setContainer} />
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
  handleRefresh: () => void
): void {
  const mode = React.useRef<string | undefined>(undefined);
  const wasAborted = React.useRef<boolean>(false);

  const [hasUnloadProtect, setUnloadProtect] = React.useState<boolean>(false);
  useUnloadProtect(hasUnloadProtect, wbText.wbUnloadProtect());

  React.useEffect(() => {
    if (!treeRanksLoaded || container === null || dataSet === undefined)
      return undefined;
    const contained = document.createElement('section');
    contained.setAttribute('class', `wbs-form ${className.containerFull}`);
    container.appendChild(contained);
    const view = new WBView({
      el: contained,
      dataset: dataSet,
      refreshInitiatedBy: mode.current,
      refreshInitiatorAborted: wasAborted.current,
      onSetUnloadProtect: setUnloadProtect,
    })
      .on('refresh', (newMode: string | undefined, newWasAborted = false) => {
        setUnloadProtect(false);
        mode.current = newMode;
        wasAborted.current = newWasAborted;
        handleRefresh();
      })
      .render();
    return () => {
      view.remove();
      legacyDialogs.forEach((destructor) => destructor());
    };
  }, [treeRanksLoaded, container, dataSet]);
}
