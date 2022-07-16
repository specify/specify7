/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import { wbText } from '../localization/workbench';
import { hasPermission, hasTablePermission } from '../permissionutils';
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
        className="wb-cell-navigation p-2 ring-0 brightness-80 hover:brightness-70"
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        data-navigation-direction="previous"
      >
        {'<'}
      </Button.Small>
      <Button.Small
        className={`
          wb-navigation-text aria-handled grid grid-cols-[auto_1fr_auto_1fr_auto] items-center
          ring-0 hover:brightness-70
        `}
        variant="bg-inherit text-gray-800 dark:text-gray-100"
        title={wbText('clickToToggle')}
      >
        {label} (<span className="wb-navigation-position text-center">0</span>/
        <span className="wb-navigation-total">0</span>)
      </Button.Small>
      <Button.Small
        type="button"
        className="wb-cell-navigation p-2 ring-0 brightness-80 hover:brightness-70"
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
        className="flex items-center justify-between gap-x-1 gap-y-2 whitespace-nowrap"
      >
        <div className="wb-name-container contents" />
        <Button.Small
          aria-pressed="false"
          aria-haspopup="grid"
          className="wb-show-toolkit"
        >
          {commonText('tools')}
        </Button.Small>
        <span className="-ml-1 flex-1" />
        {/* This button is here for debugging only */}
        <Button.Small
          className={`
            wb-show-plan
            ${process.env.NODE_ENV === 'production' ? 'hidden' : ''}
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
        className="wb-toolkit flex flex-wrap gap-x-1 gap-y-2"
        role="toolbar"
        style={{ display: 'none' }}
        aria-label={commonText('tools')}
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
      <div className="flex flex-1 gap-4 overflow-hidden">
        <section className="wb-spreadsheet flex-1 overflow-hidden overscroll-none" />
        <aside className="wb-uploaded-view-wrapper hidden" aria-live="polite" />
      </div>
      <div
        role="toolbar"
        className="flex flex-wrap justify-end gap-x-1 gap-y-2"
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
          {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
            <div className="flex">
              <Input.Text
                className="wb-replace-value"
                placeholder={wbText('replace')}
                title={wbText('replacementValue')}
                aria-label={wbText('replacementValue')}
                autoComplete="on"
              />
            </div>
          ) : undefined}
          <span className="wb-advanced-search-wrapper" />
        </span>
        <Navigation name="searchResults" label={wbText('searchResults')} />
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <Navigation name="modifiedCells" label={wbText('modifiedCells')} />
        ) : undefined}
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
