import React from 'react';

import { commonText } from '../../localization/common';
import { expressSearchConfigText } from '../../localization/expressSearchConfig';
import { getListKeyboardNavigationIndex } from '../../utils/keyboardNavigation';
import type { Tables } from '../DataModel/types';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { TableIcon } from '../Molecules/TableIcon';
import type { MappingPath } from './Mapper';
import { searchFields } from './fieldSearch';
import type { NavigatorSpec } from './navigatorSpecs';

const fieldSearchDebounceRate = 200;
const fieldSearchPageSize = 10;

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
  const fieldSearchId = React.useId();
  const resultsListId = `${fieldSearchId}-results`;
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [visibleResultCount, setVisibleResultCount] =
    React.useState(fieldSearchPageSize);
  const [activeResultIndex, setActiveResultIndex] = React.useState<
    number | undefined
  >(undefined);
  const [isDismissed, setIsDismissed] = React.useState(false);
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
    setVisibleResultCount(fieldSearchPageSize);
    setActiveResultIndex(undefined);
    setIsDismissed(false);
  }, [baseTableName, search, searchSpec, showHiddenFields]);
  const visibleResults = searchResults.slice(0, visibleResultCount);
  const isExpanded = search.length > 0 && !isDismissed;
  React.useEffect(() => {
    if (activeResultIndex === undefined || !isExpanded) return;
    const activeResult = document.getElementById(
      `${fieldSearchId}-result-${activeResultIndex}`
    );
    activeResult?.scrollIntoView?.({ block: 'nearest' });
  }, [activeResultIndex, fieldSearchId, isExpanded]);

  if (
    baseTableName === undefined ||
    typeof handleSelectSearchResult !== 'function'
  )
    return null;

  const hasMoreResults = searchResults.length > visibleResultCount;
  const handleShowMore = (): void =>
    setVisibleResultCount((count) =>
      Math.min(count + fieldSearchPageSize, searchResults.length)
    );
  const handleSelect = (resultIndex: number): void => {
    const result = searchResults[resultIndex];
    if (result === undefined) return;
    handleSelectSearchResult(result.mappingPath);
    setSearch('');
    setActiveResultIndex(undefined);
  };
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    if (event.key === 'Escape' && search.length > 0) {
      event.preventDefault();
      event.stopPropagation();
      setIsDismissed(true);
      setActiveResultIndex(undefined);
      return;
    }

    if (
      (event.key === 'Enter' || event.key === 'ArrowRight') &&
      activeResultIndex !== undefined
    ) {
      event.preventDefault();
      event.stopPropagation();
      handleSelect(activeResultIndex);
      return;
    }

    if (
      !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) ||
      searchResults.length === 0
    )
      return;

    event.preventDefault();
    event.stopPropagation();
    setIsDismissed(false);
    const shouldShowMore =
      event.key === 'ArrowDown' &&
      activeResultIndex === visibleResults.length - 1 &&
      hasMoreResults;
    if (shouldShowMore) handleShowMore();
    const nextIndex = getListKeyboardNavigationIndex({
      activeIndex: activeResultIndex ?? -1,
      itemCount: visibleResults.length + (shouldShowMore ? 1 : 0),
      key: event.key,
      wrap: true,
    });
    setActiveResultIndex(nextIndex === -1 ? undefined : nextIndex);
  };

  return (
    <div
      className="
        relative flex w-full flex-col border border-brand-300
        bg-white dark:bg-neutral-800
      "
    >
      <Input.Text
        aria-activedescendant={
          activeResultIndex === undefined || !isExpanded
            ? undefined
            : `${fieldSearchId}-result-${activeResultIndex}`
        }
        aria-autocomplete="list"
        aria-controls={resultsListId}
        aria-expanded={isExpanded}
        aria-label={commonText.search()}
        className="w-full rounded-none border-0 !ring-0 !shadow-none focus:border-0 focus:!ring-0"
        id={`${fieldSearchId}-input`}
        placeholder={expressSearchConfigText.searchFieldsTab()}
        role="combobox"
        value={search}
        onKeyDown={handleKeyDown}
        onValueChange={setSearch}
      />
      {isExpanded && (
        <div
          className="absolute left-0 top-full z-20 max-h-48 w-full overflow-y-auto border border-gray-500 bg-white dark:bg-neutral-600"
          onScroll={(event): void => {
            const element = event.currentTarget;
            if (
              element.scrollTop + element.clientHeight >=
              element.scrollHeight - 8
            )
              handleShowMore();
          }}
        >
          <div
            aria-label={commonText.search()}
            id={resultsListId}
            role="listbox"
          >
            {searchResults.length === 0 ? (
              <div className="p-2">{commonText.noResults()}</div>
            ) : (
              visibleResults.map((result, index) => (
                <button
                  aria-selected={activeResultIndex === index}
                  className={`
                    flex w-full items-center gap-2 p-2 text-left
                    hover:bg-gray-200 dark:hover:bg-neutral-700
                    ${
                      activeResultIndex === index
                        ? 'bg-gray-200 dark:bg-neutral-700'
                        : ''
                    }
                  `}
                  id={`${fieldSearchId}-result-${index}`}
                  key={result.mappingPath.join('.')}
                  role="option"
                  tabIndex={-1}
                  type="button"
                  onClick={(): void => handleSelect(index)}
                  onMouseEnter={(): void => setActiveResultIndex(index)}
                >
                  <TableIcon label={false} name={result.tableName} />
                  {result.label}
                </button>
              ))
            )}
          </div>
          {hasMoreResults && (
            <Button.LikeLink
              className="w-full justify-center p-2"
              onClick={handleShowMore}
            >
              {commonText.showMore()}
            </Button.LikeLink>
          )}
        </div>
      )}
    </div>
  );
}
