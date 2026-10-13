import React from 'react';

import { commonText } from '../../localization/common';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import type { Tables } from '../DataModel/types';
import { Input } from '../Atoms/Form';
import { TableIcon } from '../Molecules/TableIcon';
import type { MappingPath } from './Mapper';
import { searchFields } from './fieldSearch';
import type { NavigatorSpec } from './navigatorSpecs';

const fieldSearchDebounceRate = 200;

export function FieldSearch({
  baseTableName,
  showHiddenFields,
  searchSpec,
  onSelectSearchResult: handleSelectSearchResult,
}: {
  readonly baseTableName: keyof Tables | undefined;
  readonly showHiddenFields: boolean | undefined;
  readonly searchSpec: NavigatorSpec;
  readonly onSelectSearchResult:
    | ((mappingPath: MappingPath) => void)
    | undefined;
}): JSX.Element | null {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [visibleResultCount, setVisibleResultCount] = React.useState(10);
  React.useEffect(() => {
    const timeout = globalThis.setTimeout(
      () => setDebouncedSearch(search),
      fieldSearchDebounceRate
    );
    return (): void => globalThis.clearTimeout(timeout);
  }, [search]);
  const searchResults = React.useMemo(
    () =>
      baseTableName === undefined
        ? []
        : searchFields({
            baseTableName,
            search: debouncedSearch,
            showHiddenFields,
            spec: searchSpec,
          }),
    [baseTableName, debouncedSearch, searchSpec, showHiddenFields]
  );
  React.useEffect(() => {
    setVisibleResultCount(10);
  }, [baseTableName, search, searchSpec, showHiddenFields]);

  if (
    baseTableName === undefined ||
    typeof handleSelectSearchResult !== 'function'
  )
    return null;

  return (
    <div
      className="
        relative flex w-full flex-col border border-brand-300
        bg-white dark:bg-neutral-800
      "
    >
      <Input.Text
        aria-label={commonText.search()}
        className="w-full rounded-none border-0 !ring-0 !shadow-none focus:border-0 focus:!ring-0"
        id="field-search"
        placeholder={expressSearchConfigText.searchFieldsTab()}
        value={search}
        onValueChange={setSearch}
      />
      {search.length > 0 && (
        <div
          aria-label={commonText.search()}
          className="absolute left-0 top-full z-20 max-h-48 w-full overflow-y-auto border border-gray-500 bg-white dark:bg-neutral-600"
          onScroll={(event): void => {
            const element = event.currentTarget;
            if (
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 8
            )
              setVisibleResultCount((count) =>
                Math.min(count + 10, searchResults.length)
              );
          }}
        >
          {searchResults.length === 0 ? (
            <div className="p-2">{commonText.noResults()}</div>
          ) : (
            searchResults.slice(0, visibleResultCount).map((result) => (
              <button
                className="flex w-full items-center gap-2 p-2 text-left hover:bg-gray-200 dark:hover:bg-neutral-700"
                key={result.mappingPath.join('.')}
                type="button"
                onClick={(): void => {
                  handleSelectSearchResult(result.mappingPath);
                  setSearch('');
                }}
              >
                <TableIcon label={false} name={result.tableName} />
                {result.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
