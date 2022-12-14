import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery, Tables } from '../DataModel/types';
import type { CustomStat, DefaultStat, StatLayout, StatsSpec } from './types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { H3 } from '../Atoms';
import { QueryList } from '../Toolbar/Query';
import { Categories } from './Categories';
import React from 'react';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { SpecifyResource } from '../DataModel/legacyTypes';

export function AddStatDialog({
  defaultLayout,
  statsSpec,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
  onStatNetwork: handleStatNetwork,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultLayout: StatLayout;
  readonly statsSpec: StatsSpec;
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat, itemIndex: number) => void;
  readonly onStatNetwork: (
    query: SpecifyResource<SpQuery> | undefined
  ) => Promise<string | undefined>;
}): JSX.Element | null {
  const defaultStatsAddLeft = defaultLayout;
  return Array.isArray(queries) ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
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
                100
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
            <H3 className="text-lg">{statsText('selectFromDefault')}</H3>
            {defaultStatsAddLeft.map((defaultLayoutPage, index) => (
              <div key={index}>
                <h4>{defaultLayoutPage.label}</h4>
                <div>
                  <Categories
                    pageLayout={defaultLayoutPage}
                    statsSpec={statsSpec}
                    onClick={(item: DefaultStat | CustomStat): void => {
                      handleAdd(item, 100);
                      handleClose();
                    }}
                    onRemove={undefined}
                    onRename={undefined}
                    onAdd={undefined}
                    onSpecChanged={undefined}
                    onValueLoad={undefined}
                    onStatNetwork={handleStatNetwork}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  ) : null;
}
