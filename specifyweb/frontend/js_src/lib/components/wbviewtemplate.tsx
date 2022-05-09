/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import { wbText } from '../localization/workbench';
import { hasPermission } from '../permissions';
import { Button, Input, Link } from './basic';

function Navigation({
  name,
  label,
}: {
  readonly name: string;
  readonly label: string;
}): JSX.Element {
  return (
    <span
      className="wb-navigation-section flex rounded"
      data-navigation-type={name}
      aria-atomic
    >
      <Button.Small
        className={`wb-cell-navigation brightness-80 hover:brightness-70 p-2 ring-0`}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        data-navigation-direction="previous"
      >
        {'<'}
      </Button.Small>
      <Button.Small
        className={`wb-navigation-text aria-handled ring-0 grid items-center hover:brightness-70
          grid-cols-[auto_1fr_auto_1fr_auto]`}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        title={wbText('clickToToggle')}
      >
        {label} (<span className="wb-navigation-position text-center">0</span>/
        <span className="wb-navigation-total">0</span>)
      </Button.Small>
      <Button.Small
        type="button"
        className={`wb-cell-navigation brightness-80 hover:brightness-70 p-2 ring-0`}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        data-navigation-direction="next"
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
        role="toolbar"
        className="whitespace-nowrap gap-x-1 gap-y-2 flex items-center justify-between"
      >
        <div className="wb-name-container contents" />
        <Button.Small
          aria-pressed="false"
          aria-haspopup="grid"
          className="wb-show-toolkit"
        >
          {commonText('tools')}
        </Button.Small>
        <span className="flex-1 -ml-1" />
        <Button.Small className="wb-show-plan hidden">Show Plan</Button.Small>
        <Link.LikeButton href={`/workbench-plan/${dataSetId}/`}>
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
        className="wb-toolkit gap-x-1 gap-y-2 flex flex-wrap"
        role="toolbar"
        style={{ display: 'none' }}
        aria-label={commonText('tools')}
      >
        {hasPermission('/workbench/dataset', 'transfer') && (
          <Button.Small
            aria-haspopup="dialog"
            className="wb-change-data-set-owner"
          >
            {wbText('changeOwner')}
          </Button.Small>
        )}
        <Button.Small className="wb-export-data-set">
          {commonText('export')}
        </Button.Small>
        {hasPermission('/workbench/dataset', 'delete') && (
          <Button.Small aria-haspopup="dialog" className="wb-delete-data-set">
            {commonText('delete')}
          </Button.Small>
        )}
        <span className="flex-1 -ml-1" />
        {hasPermission('/workbench/dataset', 'update') && (
          <>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-convert-coordinates"
              title={wbText('unavailableWithoutLocality')}
              disabled
            >
              {wbText('convertCoordinates')}
            </Button.Small>
            <Button.Small
              aria-haspopup="dialog"
              className="wb-geolocate"
              title={wbText('unavailableWithoutLocality')}
              disabled
            >
              {localityText('geoLocate')}
            </Button.Small>
          </>
        )}
        <Button.Small
          aria-haspopup="dialog"
          className="wb-leafletmap"
          title={wbText('unavailableWithoutLocality')}
          disabled
        >
          {commonText('geoMap')}
        </Button.Small>
      </div>
      <div className="gap-x-4 flex flex-1 overflow-hidden">
        <section className="wb-spreadsheet flex-1 overflow-hidden" />
        <aside className="wb-uploaded-view-wrapper hidden" aria-live="polite" />
      </div>
      <div
        role="toolbar"
        className="gap-x-1 gap-y-2 flex flex-wrap justify-end"
        aria-label={wbText('navigation')}
      >
        <span className="contents" role="search">
          <div className="flex">
            <Input.Generic
              type="search"
              className="wb-search-query"
              placeholder={commonText('search')}
              title={commonText('searchQuery')}
              aria-label={commonText('searchQuery')}
              autoComplete="on"
              spellCheck
            />
          </div>
          {!isUploaded && (
            <div className="flex">
              <Input.Text
                className="wb-replace-value"
                placeholder={wbText('replace')}
                title={wbText('replacementValue')}
                aria-label={wbText('replacementValue')}
                autoComplete="on"
              />
            </div>
          )}
          <span className="wb-advanced-search-wrapper" />
        </span>
        <Navigation name="searchResults" label={wbText('searchResults')} />
        {!isUploaded && (
          <Navigation name="modifiedCells" label={wbText('modifiedCells')} />
        )}
        <Navigation name="newCells" label={wbText('newCells')} />
        {!isUploaded && (
          <Navigation name="invalidCells" label={wbText('errorCells')} />
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
    <WbView isUploaded={isUploaded} dataSetId={dataSetId} />
  );
