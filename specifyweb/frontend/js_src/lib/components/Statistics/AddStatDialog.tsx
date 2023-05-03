import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { statsText } from '../../localization/stats';
import type { RA } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { createQuery } from '../QueryBuilder';
import { QueryList } from '../Toolbar/Query';
import { QueryTablesWrapper } from '../Toolbar/QueryTablesWrapper';
import { AddStatPage } from './AddStatPage';
import { FrontEndStatsResultDialog, queryToSpec } from './ResultsDialog';
import type {
  CustomStat,
  DefaultStat,
  StatFormatterSpec,
  StatLayout,
} from './types';

export function AddStatDialog({
  defaultStatsAddLeft,
  queries,
  formatterSpec,
  onClose: handleClose,
  onAdd: handleAdd,
  onLoad,
  onInitialLoad: handleLoadInitial,
}: {
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly defaultStatsAddLeft: RA<StatLayout> | undefined;
  readonly formatterSpec: StatFormatterSpec;
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
  readonly onInitialLoad: () => void;
}): JSX.Element | null {
  const [newQuery, setNewQuery] = React.useState<
    SpecifyResource<SpQuery> | undefined
  >(undefined);
  const [isCreating, setIsCreating, unsetIsCreating] = useBooleanState(false);
  React.useLayoutEffect(() => {
    handleLoadInitial();
  }, []);
  return isCreating ? (
    <QueryTablesWrapper
      isReadOnly={false}
      queries={undefined}
      onClick={(tableName) => {
        const model = getModel(tableName);
        if (model !== undefined)
          setNewQuery(createQuery(queryText.newQueryName(), model));
        unsetIsCreating();
      }}
      onClose={unsetIsCreating}
    />
  ) : newQuery === undefined ? (
    <Dialog
      buttons={
        <div className="flex flex-1">
          <Button.Blue onClick={setIsCreating}>{commonText.new()}</Button.Blue>
          <span className="-ml-2 flex-1" />
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
        </div>
      }
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
                  formatterSpec={formatterSpec}
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
  ) : (
    <FrontEndStatsResultDialog
      label={queryText.newQueryName()}
      matchClone={false}
      query={newQuery}
      onClone={undefined}
      onClose={() => setNewQuery(undefined)}
      onEdit={(query) => {
        handleAdd(
          {
            type: 'CustomStat',
            label: queryText.newQueryName(),
            querySpec: query,
            itemValue: undefined,
          },
          -1
        );
        handleClose();
      }}
    />
  );
}
