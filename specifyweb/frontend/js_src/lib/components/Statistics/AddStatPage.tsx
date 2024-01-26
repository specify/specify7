import React from 'react';

import { Ul } from '../Atoms';
import { Categories } from './Categories';
import type {
  CustomStat,
  DefaultStat,
  StatFormatterSpec,
  StatLayout,
} from './types';

export function AddStatPage({
  pageLabel,
  pageIndex,
  pageLayout,
  formatterSpec,
  onClick: handleClick,
  onLoad,
}: {
  readonly pageLabel: string;
  readonly pageIndex: number;
  readonly pageLayout: StatLayout | undefined;
  readonly formatterSpec: StatFormatterSpec;
  readonly onClick:
    | ((
        item: CustomStat | DefaultStat,
        categoryIndex?: number,
        itemIndex?: number
      ) => void)
    | ((item: CustomStat | DefaultStat) => void);
  readonly onLoad:
    | ((
        pageIndex: number,
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
}): JSX.Element {
  const onLoadPage = React.useCallback(
    (categoryIndex: number, itemIndex: number, value: number | string) => {
      onLoad?.(pageIndex, categoryIndex, itemIndex, value);
    },
    [onLoad, pageIndex]
  );
  return (
    <li key={pageIndex}>
      <h4 className="text-lg font-semibold">{pageLabel}</h4>
      <Ul className="flex flex-col gap-2">
        <Categories
          formatterSpec={formatterSpec}
          hasPermission
          pageLayout={pageLayout}
          onAdd={undefined}
          onCategoryRename={undefined}
          onClick={handleClick}
          onEdit={undefined}
          onLoad={onLoadPage}
          onRemove={undefined}
          onRename={undefined}
        />
      </Ul>
    </li>
  );
}
