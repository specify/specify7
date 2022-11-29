import type { RA } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpQuery } from '../DataModel/types';
import type { CustomStat, DefaultStat, StatLayout, StatsSpec } from './types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { H3 } from '../Atoms';
import { QueryList } from '../Toolbar/Query';
import { Categories } from './Categories';
import React from 'react';

export function AddStatDialog({
  defaultLayout,
  statsSpec,
  queries,
  onClose: handleClose,
  onAdd: handleAdd,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultLayout: StatLayout;
  readonly statsSpec: StatsSpec;
  readonly onClose: () => void;
  readonly onAdd: (item: CustomStat | DefaultStat) => void;
}): JSX.Element | null {
  const defaultStatsAddLeft = defaultLayout.filter(
    ({ categories }) => categories.length > 0
  );
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
        <H3>{statsText('selectCustomStatistics')}</H3>
        {Array.isArray(queries) && (
          <QueryList
            getQuerySelectCallback={(query) => () => {
              handleAdd({ type: 'CustomStat', queryId: query.id });
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
            <H3>{statsText('selectDefaultStatistics')}</H3>
            {defaultStatsAddLeft.map((defaultLayoutItem, index) => (
              <div key={index}>
                <H3>{defaultLayoutItem.label}</H3>
                <div>
                  <Categories
                    pageLayout={defaultLayoutItem}
                    statsSpec={statsSpec}
                    onClick={(item): void => {
                      handleAdd(item);
                    }}
                    onRemove={undefined}
                    onRename={undefined}
                    onAdd={undefined}
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
