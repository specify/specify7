import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { statsText } from '../../localization/stats';
import { cleanThrottledPromises } from '../../utils/ajax/throttledPromise';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getTable } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { createQuery } from '../QueryBuilder';
import { QueryListDialog } from '../Toolbar/Query';
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
  formatterSpec,
  onClose: handleClose,
  onAdd: handleAdd,
  onLoad,
  onInitialLoad: handleLoadInitial,
}: {
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
  const [isCreating, setIsCreating, unsetIsCreating] = useBooleanState();
  React.useLayoutEffect(() => {
    handleLoadInitial();
    return cleanThrottledPromises;
  }, []);
  return isCreating ? (
    <QueryTablesWrapper
      onClick={(tableName): void => {
        const table = getTable(tableName);
        if (table !== undefined)
          setNewQuery(createQuery(queryText.newQueryName(), table));
        unsetIsCreating();
      }}
      onClose={unsetIsCreating}
    />
  ) : newQuery === undefined ? (
    <Dialog
      buttons={
        <div className="flex flex-1">
          <Button.Info onClick={setIsCreating}>{commonText.new()}</Button.Info>
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
        <ReadOnlyContext.Provider value>
          <QueryListDialog
            getQuerySelectCallback={(query) => () => {
              handleAdd(
                {
                  type: 'CustomStat',
                  label: localized(query.name),
                  querySpec: queryToSpec(query),
                  itemValue: undefined,
                },
                -1
              );
              handleClose();
            }}
            // Never used
            newQueryUrl="/specify/command/test-error"
            onClose={handleClose}
          >
            {({ children }): JSX.Element => children}
          </QueryListDialog>
        </ReadOnlyContext.Provider>
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
      query={newQuery}
      showClone={false}
      onClone={undefined}
      onClose={(): void => setNewQuery(undefined)}
      onEdit={(query): void => {
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
