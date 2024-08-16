import React from 'react';
import _ from 'underscore';

import { useBooleanState } from '../../hooks/useBooleanState';
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
  searchRef,
}: {
  readonly isUploaded: boolean;
  readonly cellCounts: WbCellCounts;
  readonly utils: WbUtils;
  readonly cells: WbCellMeta;
  readonly debounceRate: number;
  readonly searchRef: React.MutableRefObject<HTMLInputElement | null>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const replaceRef = React.useRef<HTMLInputElement | null>(null);

  const [isSearchClicked, clickSearch, unclickSearch, toggleSearch] =
    useBooleanState(true);

  const handleSearch = React.useCallback(
    _.debounce((event: React.KeyboardEvent<HTMLInputElement>) => {
      if (searchRef.current && searchRef.current?.value.length > 0)
        unclickSearch();
      else clickSearch();
      utils.searchCells(event, searchRef.current);
    }, debounceRate),
    [debounceRate, utils]
  );

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
            onKeyDown={handleSearch}
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
              title={
                isReadOnly
                  ? wbText.unavailableWhileViewingResults()
                  : wbText.replacementValue()
              }
              type="search"
              onKeyDown={(event) =>
                utils.replaceCells(event, replaceRef.current)
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
            if (
              utils.searchPreferences.search.liveUpdate &&
              searchRef.current !== null
            )
              utils.searchCells(
                {
                  key: 'SettingsChange',
                },
                searchRef.current
              );
          }}
        />
      </span>
      <Navigation
        isPressed={isSearchClicked}
        label={wbText.searchResults()}
        name="searchResults"
        totalCount={cellCounts.searchResults}
        utils={utils}
        onToggle={toggleSearch}
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
      <Navigation
        label={wbText.updatedCells()}
        name="updatedCells"
        totalCount={cellCounts.updatedCells}
        utils={utils}
      />
      <Navigation
        label={wbText.deletedCells()}
        name="deletedCells"
        totalCount={cellCounts.deletedCells}
        utils={utils}
      />
      <Navigation
        label={wbText.matchAndChanged()}
        name="matchedAndChangedCells"
        totalCount={cellCounts.matchedAndChangedCells}
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
