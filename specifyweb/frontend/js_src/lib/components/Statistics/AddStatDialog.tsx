import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import type { CustomStat, DefaultStat, StatLayout } from './types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { H3, Ul } from '../Atoms';
import { QueryList } from '../Toolbar/Query';
import React from 'react';
import { AddStatPage } from './AddStatPage';
import { queryToSpec } from './ResultsDialog';

export function AddStatDialog({
  defaultStatsAddLeft,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
  onLoad: onLoad,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultStatsAddLeft: StatLayout | undefined;
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
        {typeof defaultStatsAddLeft === 'object' && (
          <div>
            <H3 className="text-xl">{statsText.selectFromDefault()}</H3>
            <Ul>
              {defaultStatsAddLeft.map((defaultLayoutPage, index) =>
                defaultLayoutPage.categories.every(({ items = [] }) =>
                  items.every(
                    (item) =>
                      item.type === 'DefaultStat' && item.isVisible === false
                  )
                ) ? undefined : (
                  <AddStatPage
                    pageLabel={defaultLayoutPage.label}
                    pageIndex={index}
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
          </div>
        )}
      </div>
    </Dialog>
  ) : null;
}
