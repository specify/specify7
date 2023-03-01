import React from 'react';

import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import type { RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryList } from '../Toolbar/Query';
import { AddStatPage } from './AddStatPage';
import { queryToSpec } from './ResultsDialog';
import type { CustomStat, DefaultStat, StatLayout } from './types';

export function AddStatDialog({
  defaultStatsAddLeft,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
  onLoad,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultStatsAddLeft: RA<StatLayout> | undefined;
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat, itemIndex: number) => void;
  readonly onLoad:
    | ((
        pageIndex: number,
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
}): JSX.Element | null {
  return Array.isArray(queries) || defaultStatsAddLeft !== undefined ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      className={{
        container: `${dialogClassNames.wideContainer}`,
        content: 'flex flex-col gap-8',
      }}
      header={statsText.chooseStatistics()}
      onClose={handleClose}
    >
      <div>
        <H3 className="text-lg">{statsText.selectFromQueries()}</H3>
        {Array.isArray(queries) && (
          <QueryList
            getQuerySelectCallback={(query) => () => {
              handleAdd(
                {
                  type: 'CustomStat',
                  label: query.name,
                  querySpec: queryToSpec(query),
                  itemValue: undefined,
                },
                -1
              );
              handleClose();
            }}
            isReadOnly
            queries={queries}
          />
        )}
      </div>
      <div>
        <H3 className="text-lg">{statsText.selectFromAvailableDefault()}</H3>
        {typeof defaultStatsAddLeft === 'object' && (
          <Ul>
            {defaultStatsAddLeft.map((defaultLayoutPage, index) =>
              defaultLayoutPage.categories.every(({ items = [] }) =>
                items.every(
                  (item) =>
                    item.type === 'DefaultStat' && item.isVisible === false
                )
              ) ? undefined : (
                <AddStatPage
                  key={index}
                  pageIndex={index}
                  pageLabel={defaultLayoutPage.label}
                  pageLayout={defaultLayoutPage}
                  onClick={(item: CustomStat | DefaultStat): void => {
                    handleAdd(item, -1);
                    handleClose();
                  }}
                  onLoad={onLoad}
                />
              )
            )}
          </Ul>
        )}
      </div>
    </Dialog>
  ) : null;
}
