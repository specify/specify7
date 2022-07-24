/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { useParams } from 'react-router-dom';

import { f } from '../functools';
import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import { wbText } from '../localization/workbench';
import { hasPermission, hasTablePermission } from '../permissionutils';
import { treeRanksPromise } from '../treedefinitions';
import { WBView } from '../wbview';
import { Button, Input, Link } from './basic';
import { useAsyncState } from './hooks';
import { NotFoundView } from './notfoundview';
import { ajax } from '../ajax';
import { Dataset } from './wbplanview';
import { LoadingContext } from './contexts';
import { GetSet } from '../types';
import { useMenuItem } from './header';

function Navigation({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
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
      >
        {'<'}
      </Button.Small>
      <Button.Small
        className={`
          wb-navigation-text aria-handled grid grid-cols-[auto_1fr_auto_1fr_auto] items-center
          ring-0 hover:brightness-70
        `}
        title={wbText('clickToToggle')}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
      >
        {label} (<span className="wb-navigation-position text-center">0</span>/
        <span className="wb-navigation-total">0</span>)
      </Button.Small>
      <Button.Small
        className="wb-cell-navigation p-2 ring-0 brightness-80 hover:brightness-70"
        data-navigation-direction="next"
        type="button"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
      >
        {'>'}
      </Button.Small>
    </span>
  );
}

function WbView({
  isUploaded,
  dataSetId,
}: {
  readonly isUploaded: boolean;
  readonly dataSetId: number;
}): JSX.Element {
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
        >
          {commonText('tools')}
        </Button.Small>
        <span className="-ml-1 flex-1" />
        {/* This button is here for debugging only */}
        <Button.Small
          className={`
            wb-show-plan
            ${process.env.NODE_ENV === 'development' ? '' : 'hidden'}
          `}
        >
          [DEV] Show Plan
        </Button.Small>
        <Link.LikeButton href={`/specify/workbench-plan/${dataSetId}/`}>
          {wbText('dataMapper')}
        </Link.LikeButton>
        {!isUploaded && hasPermission('/workbench/dataset', 'validate') && (
          <Button.Small aria-haspopup="dialog" className="wb-validate" disabled>
            {wbText('validate')}
          </Button.Small>
        )}
        <Button.Small
          aria-haspopup="tree"
          className="wb-show-upload-view"
          disabled
          title={wbText('wbUploadedUnavailable')}
        >
          {commonText('results')}
        </Button.Small>
        {isUploaded ? (
          hasPermission('/workbench/dataset', 'unupload') && (
            <Button.Small aria-haspopup="dialog" className="wb-unupload">
              {wbText('rollback')}
            </Button.Small>
          )
        ) : (
          <>
            {hasPermission('/workbench/dataset', 'upload') && (
              <Button.Small aria-haspopup="dialog" className="wb-upload">
                {wbText('upload')}
              </Button.Small>
            )}
            {hasPermission('/workbench/dataset', 'update') && (
              <>
                <Button.Small
                  aria-haspopup="dialog"
                  className="wb-revert"
                  disabled
                >
                  {wbText('revert')}
                </Button.Small>
                <Button.Small
                  aria-haspopup="dialog"
                  className="wb-save"
                  disabled
                >
                  {commonText('save')}
                </Button.Small>
              </>
            )}
          </>
        )}
      </div>
      <div
        aria-label={commonText('tools')}
        className="wb-toolkit flex flex-wrap gap-x-1 gap-y-2"
        role="toolbar"
        style={{ display: 'none' }}
      >
        {hasPermission('/workbench/dataset', 'transfer') &&
        hasTablePermission('SpecifyUser', 'read') ? (
          <Button.Small
            aria-haspopup="dialog"
            className="wb-change-data-set-owner"
          >
            {wbText('changeOwner')}
          </Button.Small>
        ) : undefined}
        <Button.Small className="wb-export-data-set">
          {commonText('export')}
        </Button.Small>
        {hasPermission('/workbench/dataset', 'delete') && (
          <Button.Small aria-haspopup="dialog" className="wb-delete-data-set">
            {commonText('delete')}
          </Button.Small>
        )}
        <span className="-ml-1 flex-1" />
        {hasPermission('/workbench/dataset', 'update') && (
          <>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-convert-coordinates"
              disabled
              title={wbText('unavailableWithoutLocality')}
            >
              {wbText('convertCoordinates')}
            </Button.Small>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-geolocate"
              disabled
              title={wbText('unavailableWithoutLocality')}
            >
              {localityText('geoLocate')}
            </Button.Small>
          </>
        )}
        <Button.Small
          aria-haspopup="dialog"
          className="wb-leafletmap"
          disabled
          title={wbText('unavailableWithoutLocality')}
        >
          {commonText('geoMap')}
        </Button.Small>
      </div>
      <div className="flex flex-1 gap-4 overflow-hidden">
        <section className="wb-spreadsheet flex-1 overflow-hidden overscroll-none" />
        <aside aria-live="polite" className="wb-uploaded-view-wrapper hidden" />
      </div>
      <div
        aria-label={wbText('navigation')}
        className="flex flex-wrap justify-end gap-x-1 gap-y-2"
        role="toolbar"
      >
        <span className="contents" role="search">
          <div className="flex">
            <Input.Generic
              aria-label={commonText('searchQuery')}
              autoComplete="on"
              className="wb-search-query"
              placeholder={commonText('search')}
              spellCheck
              title={commonText('searchQuery')}
              type="search"
            />
          </div>
          {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
            <div className="flex">
              <Input.Text
                aria-label={wbText('replacementValue')}
                autoComplete="on"
                className="wb-replace-value"
                placeholder={wbText('replace')}
                title={wbText('replacementValue')}
              />
            </div>
          ) : undefined}
          <span className="wb-advanced-search-wrapper" />
        </span>
        <Navigation label={wbText('searchResults')} name="searchResults" />
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <Navigation label={wbText('modifiedCells')} name="modifiedCells" />
        ) : undefined}
        <Navigation label={wbText('newCells')} name="newCells" />
        {!isUploaded && (
          <Navigation label={wbText('errorCells')} name="invalidCells" />
        )}
      </div>
    </>
  );
}

export const wbViewTemplate = (
  isUploaded: boolean,
  dataSetId: number
): string =>
  ReactDOMServer.renderToStaticMarkup(
    <WbView dataSetId={dataSetId} isUploaded={isUploaded} />
  );

const fetchTreeRanks = async (): Promise<true> => treeRanksPromise.then(f.true);

export function WorkBench(): JSX.Element | null {
  useMenuItem('workBench');

  const [treeRanksLoaded = false] = useAsyncState(fetchTreeRanks, true);
  const { id = '' } = useParams();
  const dataSetId = f.parseInt(id);

  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  const [dataSet, setDataSet] = useDataSet(dataSetId);
  const loading = React.useContext(LoadingContext);
  useWbView(dataSet, treeRanksLoaded, container, () =>
    loading(fetchDataSet(dataSet!.id).then(setDataSet))
  );

  return dataSetId === undefined ? (
    <NotFoundView />
  ) : (
    <section ref={setContainer} />
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
  React.useEffect(() => {
    if (!treeRanksLoaded || container === null || dataSet === undefined)
      return undefined;
    const view = new WBView({
      el: container,
      dataset: dataSet,
      refreshInitiatedBy: mode.current,
      refreshInitiatorAborted: wasAborted.current,
    }).on(
      'refresh',
      (newMode: string | undefined, newWasAborted: boolean = false) => {
        mode.current = newMode;
        wasAborted.current = newWasAborted;
        handleRefresh();
      }
    );
    return () => view.remove();
  }, [treeRanksLoaded, container, dataSet]);
}
