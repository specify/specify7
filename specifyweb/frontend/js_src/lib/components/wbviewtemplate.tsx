/**
 * Generate static template for the WbView using React
 * All logic and event listeners would be attached in WbView.js
 */

import React from 'react';
import ReactDOMServer from 'react-dom/server';

import commonText from '../localization/common';
import localityText from '../localization/locality';
import wbText from '../localization/workbench';
import { hasPermission } from '../permissions';
import { Button, Input } from './basic';

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
      <Button.Simple
        className="wb-cell-navigation bg-inherit hover:bg-inherit brightness-80 hover:brightness-70 p-2 border-none"
        data-navigation-direction="previous"
      >
        &lt;
      </Button.Simple>
      <Button.Simple
        className="wb-navigation-text aria-handled bg-inherit hover:bg-inherit border-none grid items-center hover:brightness-70 grid-cols-[auto_1fr_auto_1fr_auto]"
        title={wbText('clickToToggle')}
      >
        {label} (<span className="wb-navigation-position text-center">0</span>/
        <span className="wb-navigation-total">0</span>)
      </Button.Simple>
      <Button.Simple
        type="button"
        className="wb-cell-navigation bg-inherit hover:bg-inherit brightness-80 hover:brightness-70 p-2 border-none"
        data-navigation-direction="next"
      >
        &gt;
      </Button.Simple>
    </span>
  );
}

function WbView({ isUploaded }: { readonly isUploaded: boolean }): JSX.Element {
  return (
    <>
      <div
        role="toolbar"
        className="whitespace-nowrap gap-x-1 gap-y-2 flex items-center justify-between"
      >
        <div className="wb-name-container contents" />
        <Button.Simple
          aria-pressed="false"
          aria-haspopup="grid"
          className="wb-show-toolkit"
        >
          {commonText('tools')}
        </Button.Simple>
        <span className="flex-1 -ml-1" />
        <Button.Simple className="wb-show-plan hidden">Show Plan</Button.Simple>
        <Button.Simple className="button wb-plan">
          {wbText('dataMapper')}
        </Button.Simple>
        {!isUploaded && hasPermission('/workbench/dataset', 'validate') && (
          <Button.Simple
            aria-haspopup="dialog"
            className="wb-validate"
            disabled
          >
            {wbText('validate')}
          </Button.Simple>
        )}
        <Button.Simple
          aria-haspopup="tree"
          className="wb-show-upload-view"
          disabled
          title={wbText('wbUploadedUnavailable')}
        >
          {commonText('results')}
        </Button.Simple>
        {isUploaded ? (
          hasPermission('/workbench/dataset', 'unupload') && (
            <Button.Simple aria-haspopup="dialog" className="wb-unupload">
              {wbText('rollback')}
            </Button.Simple>
          )
        ) : (
          <>
            {hasPermission('/workbench/dataset', 'upload') && (
              <Button.Simple aria-haspopup="dialog" className="wb-upload">
                {wbText('upload')}
              </Button.Simple>
            )}
            {hasPermission('/workbench/dataset', 'update') && (
              <>
                <Button.Simple
                  aria-haspopup="dialog"
                  className="wb-revert"
                  disabled
                >
                  {wbText('revert')}
                </Button.Simple>
                <Button.Simple
                  aria-haspopup="dialog"
                  className="wb-save"
                  disabled
                >
                  {commonText('save')}
                </Button.Simple>
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
          <Button.Simple
            aria-haspopup="dialog"
            className="wb-change-data-set-owner"
          >
            {wbText('changeOwner')}
          </Button.Simple>
        )}
        <Button.Simple className="wb-export-data-set">
          {commonText('export')}
        </Button.Simple>
        {hasPermission('/workbench/dataset', 'delete') && (
          <Button.Simple aria-haspopup="dialog" className="wb-delete-data-set">
            {commonText('delete')}
          </Button.Simple>
        )}
        <span className="flex-1 -ml-1" />
        {hasPermission('/workbench/dataset', 'update') && (
          <>
            <Button.Simple
              aria-haspopup="dialog"
              className="wb-convert-coordinates"
              title={wbText('unavailableWithoutLocality')}
              disabled
            >
              {wbText('convertCoordinates')}
            </Button.Simple>
            <Button.Simple
              aria-haspopup="dialog"
              className="wb-geolocate"
              title={wbText('unavailableWithoutLocality')}
              disabled
            >
              {localityText('geoLocate')}
            </Button.Simple>
          </>
        )}
        <Button.Simple
          aria-haspopup="dialog"
          className="wb-leafletmap"
          title={wbText('unavailableWithoutLocality')}
          disabled
        >
          {commonText('geoMap')}
        </Button.Simple>
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
          <Input.Generic
            type="search"
            className="wb-search-query"
            placeholder={commonText('search')}
            title={commonText('searchQuery')}
            aria-label={commonText('searchQuery')}
            autoComplete="on"
            spellCheck
          />
          {!isUploaded && (
            <Input.Text
              className="wb-replace-value"
              placeholder={wbText('replace')}
              title={wbText('replacementValue')}
              aria-label={wbText('replacementValue')}
              autoComplete="on"
            />
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

export const wbViewTemplate = (isUploaded: boolean): string =>
  ReactDOMServer.renderToStaticMarkup(<WbView isUploaded={isUploaded} />);
