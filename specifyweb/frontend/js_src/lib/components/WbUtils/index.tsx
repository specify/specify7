import React from 'react';
import _ from 'underscore';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { hasPermission } from '../Permissions/helpers';
import { WbAdvancedSearch } from '../WorkBench/AdvancedSearch';
import type { WbCellCounts, WbCellMeta } from '../WorkBench/CellMeta';
import { Navigation } from './Navigation';
import type { WbUtils } from './Utils';

export function WbUtilsComponent({
  isUploaded,
  cellCounts,
  utils,
  cells,
  debounceRate,
}: {
  readonly isUploaded: boolean;
  readonly cellCounts: WbCellCounts;
  readonly utils: WbUtils;
  readonly cells: WbCellMeta;
  readonly debounceRate: number;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const replaceRef = React.useRef<HTMLInputElement | null>(null);

  return (
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
            forwardRef={searchRef}
            placeholder={commonText.search()}
            spellCheck
            title={commonText.searchQuery()}
            type="search"
            onKeyDown={_.debounce(
              (event: React.KeyboardEvent<HTMLInputElement>) =>
                utils.searchCells(event, searchRef.current!),
              debounceRate,
              true
            )}
          />
        </div>
        {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
          <div className="flex">
            <Input.Generic
              aria-label={wbText.replacementValue()}
              autoComplete="on"
              disabled={isReadOnly}
              forwardRef={replaceRef}
              placeholder={wbText.replace()}
              title={wbText.replacementValue()}
              type="search"
              onKeyDown={(event) =>
                utils.replaceCells(event, replaceRef.current!)
              }
            />
          </div>
        ) : undefined}
        <WbAdvancedSearch
          initialSearchPreferences={utils.searchPreferences}
          onChange={(newSearchPreferences) => {
            if (
              newSearchPreferences.navigation.direction !==
              utils.searchPreferences.navigation.direction
            ) {
              cells.indexedCellMeta = undefined;
            }
            utils.searchPreferences = newSearchPreferences;
            /*
             * TODO: figure out what searchCells with SettingsChange does
             * if (utils.searchPreferences.search.liveUpdate)
             *   utils.searchCells({
             *     key: 'SettingsChange',
             *   }).catch(softFail);
             */
          }}
        />
      </span>
      <Navigation
        label={wbText.searchResults()}
        name="searchResults"
        totalCount={cellCounts.searchResults}
        utils={utils}
      />
      {!isUploaded && hasPermission('/workbench/dataset', 'update') ? (
        <Navigation
          label={wbText.modifiedCells()}
          name="modifiedCells"
          totalCount={cellCounts.modifiedCells}
          utils={utils}
        />
      ) : undefined}
      <Navigation
        label={wbText.newCells()}
        name="newCells"
        totalCount={cellCounts.newCells}
        utils={utils}
      />
      {!isUploaded && (
        <Navigation
          label={wbText.errorCells()}
          name="invalidCells"
          totalCount={cellCounts.invalidCells}
          utils={utils}
        />
      )}
    </div>
  );
}
