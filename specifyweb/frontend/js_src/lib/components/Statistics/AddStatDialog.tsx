import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery, Tables } from '../DataModel/types';
import type { CustomStat, DefaultStat, StatLayout, StatsSpec } from './types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { H2, H3, Ul } from '../Atoms';
import { QueryList } from '../Toolbar/Query';
import { Categories } from './Categories';
import React from 'react';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';

export function AddStatDialog({
  defaultStatsAddLeft,
  statsSpec,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
  onValueLoad: handleValueLoad,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultStatsAddLeft: StatLayout;
  readonly layout: StatLayout;
  readonly statsSpec: StatsSpec;
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat, itemIndex: number) => void;
  readonly onValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string,
        pageIndex: number
      ) => void)
    | undefined;
}): JSX.Element | null {
  return Array.isArray(queries) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: `${dialogClassNames.wideContainer}`,
        content: 'flex flex-col gap-8',
      }}
      header={statsText('chooseStatistics')}
      onClose={handleClose}
    >
      <div>
        <H3 className="text-lg">{statsText('selectFromQueries')}</H3>
        {Array.isArray(queries) && (
          <QueryList
            getQuerySelectCallback={(query) => () => {
              handleAdd(
                {
                  type: 'CustomStat',
                  itemLabel: query.name,
                  tableName: query.contextName as keyof Tables,
                  fields: query.fields.map((field) => ({
                    ...field,
                    path: QueryFieldSpec.fromStringId(
                      field.stringId,
                      field.isRelFld ?? false
                    )
                      .toMappingPath()
                      .join('.'),
                  })),
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
        {defaultStatsAddLeft.length > 0 && (
          <div>
            <H3 className="text-xl">{statsText('selectFromDefault')}</H3>
            <Ul>
              {defaultStatsAddLeft.map((defaultLayoutPage, index) =>
                defaultLayoutPage.categories.every(({ items }) =>
                  items.every(
                    (item) =>
                      item.type === 'DefaultStat' && item.absent === true
                  )
                ) ? undefined : (
                  <li key={index}>
                    <h4 className="text-lg font-semibold">
                      {defaultLayoutPage.label}
                    </h4>
                    <Ul className="flex flex-col gap-2">
                      <Categories
                        pageLayout={defaultLayoutPage}
                        statsSpec={statsSpec}
                        onClick={(item: DefaultStat | CustomStat): void => {
                          handleAdd(item, -1);
                          handleClose();
                        }}
                        onRemove={undefined}
                        onCategoryRename={undefined}
                        onItemRename={undefined}
                        onAdd={undefined}
                        onSpecChanged={undefined}
                        onValueLoad={(
                          categoryIndex: number,
                          itemIndex: number,
                          value: number | string,
                          itemLabel: string
                        ) => {
                          handleValueLoad(
                            categoryIndex,
                            itemIndex,
                            value,
                            itemLabel,
                            index
                          );
                        }}
                      />
                    </Ul>
                  </li>
                )
              )}
            </Ul>
          </div>
        )}
      </div>
    </Dialog>
  ) : null;
}
