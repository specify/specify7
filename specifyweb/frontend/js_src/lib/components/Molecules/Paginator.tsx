import React from 'react';

import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import type { GetSet } from '../../utils/types';
import { Select } from '../Atoms/Form';
import { formatNumber } from '../Atoms/Internationalization';
import { Slider } from '../FormSliders/Slider';

/**
 * Infinity hitting the practical limits
 */
const infinity = 500;
export const pageSizes = [10, 50, 100, infinity];

export type Paginators = 'queryBuilder' | 'recordSets';

export function usePaginator(
  cacheName: Paginators,
  defaultRowsPerPage: (typeof pageSizes)[number] = 10
): {
  readonly paginator: (totalCount: number | undefined) => JSX.Element;
  readonly currentPage: GetSet<number>;
  readonly limit: number;
  readonly offset: number;
} {
  const getSetPage = React.useState<number>(0);
  const [currentPage, setCurrentPage] = getSetPage;
  const [pageSize = defaultRowsPerPage, setPageSize] = useCachedState(
    'pageSizes',
    cacheName
  );
  return {
    paginator(totalCount): JSX.Element {
      const pageCount =
        totalCount === undefined ? 0 : Math.ceil(totalCount / pageSize);
      return (
        <div className="flex flex-wrap gap-2">
          <span className="flex-1" />
          {pageSize === infinity ? undefined : (
            <div>
              <Slider
                count={pageCount ?? 0}
                value={currentPage}
                onChange={setCurrentPage}
              />
            </div>
          )}
          <div className="flex flex-1 justify-end">
            <Select
              className={pageSize === infinity ? '!w-auto' : '!w-16'}
              value={pageSize}
              onValueChange={(rawNewPageSize): void => {
                const newPageSize = Number.parseInt(rawNewPageSize);
                const currentIndex = currentPage * pageSize;
                setPageSize(newPageSize);
                setCurrentPage(Math.floor(currentIndex / newPageSize));
              }}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size === infinity
                    ? commonText.unlimited()
                    : formatNumber(size)}
                </option>
              ))}
            </Select>
          </div>
        </div>
      );
    },
    currentPage: getSetPage,
    limit: pageSize,
    offset: currentPage * pageSize,
  };
}
