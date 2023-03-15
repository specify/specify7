import React from 'react';
import { Select } from '../Atoms/Form';
import { Slider } from '../FormSliders/Slider';

export function usePaginator({
  totalCount,
  onPageChange: handlePageChange,
  currentPage,
  rowsPerPage,
  rowsPerPageValue = 10,
}: {
  readonly totalCount: number | undefined;
  readonly onPageChange: (selected: number) => void;
  readonly currentPage: number;
  readonly rowsPerPage: (selected: number) => void;
  readonly rowsPerPageValue: number;
}): { paginator: JSX.Element } {
  const pageCount =
    totalCount === undefined ? 0 : Math.ceil(totalCount / rowsPerPageValue);
  return {
    paginator: (
      <div className="flex flex-wrap gap-2">
        <span className="flex-1"></span>
        {rowsPerPageValue === 500 ? (
          ''
        ) : (
          <div>
            <Slider
              count={pageCount ?? 0}
              value={currentPage}
              onChange={handlePageChange}
            />
          </div>
        )}
        <div className="flex flex-1 justify-end">
          <Select
            value={rowsPerPageValue}
            onValueChange={(selected) => {
              const currentIndex = currentPage * rowsPerPageValue;
              rowsPerPage(Number.parseInt(selected));
              const newPageIndex = Math.floor(
                currentIndex / Number.parseInt(selected)
              );
              handlePageChange(newPageIndex);
            }}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>Unlimited</option>
          </Select>
        </div>
      </div>
    ),
  };
}
