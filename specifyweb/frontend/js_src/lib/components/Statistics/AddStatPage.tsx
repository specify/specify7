import { CustomStat, DefaultStat, StatLayout, StatsSpec } from './types';
import { Ul } from '../Atoms';
import { Categories } from './Categories';
import React from 'react';

export function AddStatPage({
  pageLabel,
  pageIndex,
  pageLayout,
  statsSpec,
  onClick: handleClick,
  onValueLoad: handleValueLoad,
}: {
  readonly pageLabel: string;
  readonly pageIndex: number;
  readonly pageLayout: StatLayout[number] | undefined;
  readonly statsSpec: StatsSpec;
  readonly onClick:
    | ((
        item: CustomStat | DefaultStat,
        categoryIndex?: number,
        itemIndex?: number
      ) => void)
    | ((item: CustomStat | DefaultStat) => void)
    | undefined;
  readonly onValueLoad:
    | ((
        pageIndex: number,
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
}): JSX.Element {
  const handleValueLoadPage = React.useCallback(
    (categoryIndex: number, itemIndex: number, value: number | string) => {
      handleValueLoad?.(pageIndex, categoryIndex, itemIndex, value);
    },
    [handleValueLoad, pageIndex]
  );
  return (
    <li key={pageIndex}>
      <h4 className="text-lg font-semibold">{pageLabel}</h4>
      <Ul className="flex flex-col gap-2">
        <Categories
          pageLayout={pageLayout}
          statsSpec={statsSpec}
          onClick={handleClick}
          onRemove={undefined}
          onCategoryRename={undefined}
          onItemRename={undefined}
          onAdd={undefined}
          onSpecChanged={undefined}
          onValueLoad={handleValueLoadPage}
        />
      </Ul>
    </li>
  );
}
