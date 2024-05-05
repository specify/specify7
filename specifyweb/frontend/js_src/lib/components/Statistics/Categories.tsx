import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { userText } from '../../localization/user';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input } from '../Atoms/Form';
import type { Tables } from '../DataModel/types';
import { getNoAccessTables } from '../QueryBuilder/helpers';
import { generateStatUrl, makeSerializedFieldsFromPaths } from './hooks';
import { StatItem } from './StatItems';
import { backEndStatsSpec, dynamicStatsSpec, statsSpec } from './StatsSpec';
import type {
  CustomStat,
  DefaultStat,
  QuerySpec,
  StatFormatterSpec,
  StatLayout,
} from './types';

/**
 * Used for overriding backend and dynamic items (dynamic categories).
 * If user doesn't have permission for dynamic category, then shows
 * no permission text otherwise show loading. Also needs to handle
 * cases where they don't have permission for any table that comes
 * up when doing dynamic categories.
 *
 */
function ItemOverride({
  item,
}: {
  readonly item: CustomStat | DefaultStat;
}): JSX.Element {
  const urlToFetch =
    item.type === 'DefaultStat'
      ? generateStatUrl(
          statsSpec[item.pageName].urlPrefix,
          item.categoryName,
          item.itemName
        )
      : undefined;

  const backEndSpecResolve = backEndStatsSpec.find(
    ({ responseKey }) => responseKey === urlToFetch
  );
  const dynamicSpecResolve = dynamicStatsSpec.find(
    ({ responseKey }) => responseKey === urlToFetch
  );
  const noAccessTables: RA<keyof Tables> = React.useMemo(
    () =>
      filterArray([
        /*
         * Dummy value to get the tables involved in the backend queries. Need this
         * to show no permission when backend query fails due to permission denied
         * The backend tables could be stored separately to avoid this
         */
        backEndSpecResolve?.querySpec?.(backEndSpecResolve.responseKey),
        dynamicSpecResolve?.dynamicQuerySpec,
      ])
        .map((querySpec) =>
          makeSerializedFieldsFromPaths(querySpec.tableName, querySpec.fields)
        )
        .flatMap(getNoAccessTables),
    [urlToFetch]
  );

  return (
    <>
      {noAccessTables.length > 0
        ? userText.noPermission()
        : commonText.loading()}
    </>
  );
}

function areItemsValid(items: RA<CustomStat | DefaultStat>) {
  const itemNameToSearch = new Set(['phantomItem', 'dynamicPhantomItem']);
  return !items.some(
    (item) =>
      item.type === 'DefaultStat' &&
      itemNameToSearch.has(item.itemName) &&
      item.pathToValue === undefined
  );
}

export function Categories({
  pageLayout,
  formatterSpec,
  hasPermission,
  onAdd: handleAdd,
  onClick: handleClick,
  onRemove: handleRemove,
  onCategoryRename: handleCategoryRename,
  onRename: handleRename,
  onEdit: handleEdit,
  onLoad,
}: {
  readonly pageLayout: StatLayout | undefined;
  readonly formatterSpec: StatFormatterSpec;
  readonly hasPermission: boolean;
  readonly onAdd: ((categoryIndex: number | undefined) => void) | undefined;
  readonly onClick: (
    item: CustomStat | DefaultStat,
    categoryIndex?: number,
    itemIndex?: number
  ) => void;
  readonly onRemove:
    | ((categoryIndex: number, itemIndex: number | undefined) => void)
    | undefined;
  readonly onCategoryRename:
    | ((newName: LocalizedString, categoryIndex: number) => void)
    | undefined;
  readonly onEdit:
    | ((categoryIndex: number, itemIndex: number, querySpec: QuerySpec) => void)
    | undefined;
  readonly onLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string
      ) => void)
    | undefined;
  readonly onRename:
    | ((categoryIndex: number, itemIndex: number, newLabel: string) => void)
    | undefined;
}): JSX.Element | null {
  const checkEmptyItems = handleRemove === undefined;

  /**
   * If checkEmptyItems is false, show category. Else, check if category contains custom stats
   * or if it contains default stats which aren't isVisible as false
   */
  const shouldShowCategory = (
    items: RA<CustomStat | DefaultStat> | undefined
  ): boolean =>
    !checkEmptyItems ||
    (items ?? []).some(
      (item) => item.type === 'CustomStat' || item.isVisible === undefined
    );
  return pageLayout === undefined ? null : (
    <>
      {pageLayout.categories.map(
        ({ label, items }, categoryIndex) =>
          shouldShowCategory(items) && (
            <li
              className={
                checkEmptyItems
                  ? ''
                  : `flex h-auto max-h-80 flex-col content-center rounded bg-[color:var(--form-foreground)] 
                     shadow-lg shadow-gray-300 transition hover:shadow-md hover:shadow-gray-400 
                     ${typeof handleAdd === 'function' ? 'gap-2 p-4' : ''}`
              }
              key={categoryIndex}
            >
              {handleCategoryRename === undefined ? (
                checkEmptyItems ? (
                  <h5 className="font-semibold">{label}</h5>
                ) : (
                  <h3 className="bg-brand-300 overflow-auto rounded-t p-3 pb-[0.1rem] pt-[0.1rem] text-lg font-semibold text-white">
                    {label}
                  </h3>
                )
              ) : (
                <Input.Text
                  required
                  value={label.trim() === '' ? '' : label}
                  onValueChange={(newname): void =>
                    handleCategoryRename(newname, categoryIndex)
                  }
                />
              )}
              <Ul
                className={
                  handleCategoryRename === undefined
                    ? `flex-1 overflow-auto ${
                        checkEmptyItems ? 'p-0' : 'p-3 pt-3'
                      }`
                    : 'grid grid-cols-[auto_1fr_max-content] gap-2 overflow-auto p-2'
                }
              >
                {areItemsValid(items) ? (
                  items.map((item, itemIndex) =>
                    item.type === 'CustomStat' ||
                    item.isVisible === undefined ? (
                      <StatItem
                        categoryIndex={categoryIndex}
                        formatterSpec={formatterSpec}
                        hasPermission={hasPermission}
                        item={item}
                        itemIndex={itemIndex}
                        key={itemIndex}
                        onClick={
                          item.type === 'DefaultStat' && checkEmptyItems
                            ? (): void =>
                                handleClick({
                                  type: 'DefaultStat',
                                  pageName: item.pageName,
                                  categoryName: item.categoryName,
                                  itemName: item.itemName,
                                  label: item.label,
                                  itemValue: item.itemValue,
                                  itemType: item.itemType,
                                  pathToValue:
                                    item.itemType === 'BackEndStat' &&
                                    item.itemName === 'phantomItem'
                                      ? item.label
                                      : item.pathToValue,
                                })
                            : undefined
                        }
                        onClone={() => handleClick(item, categoryIndex)}
                        onEdit={
                          // REFACTOR: Use if/else conditions
                          checkEmptyItems || handleEdit === undefined
                            ? undefined
                            : item.type === 'DefaultStat'
                            ? (querySpec, itemName): void =>
                                handleClick(
                                  {
                                    type: 'CustomStat',
                                    label: itemName,
                                    querySpec: {
                                      tableName: querySpec.tableName,
                                      fields: querySpec.fields,
                                      isDistinct: querySpec.isDistinct,
                                    },
                                  },
                                  categoryIndex,
                                  itemIndex
                                )
                            : (querySpec): void =>
                                handleEdit?.(
                                  categoryIndex,
                                  itemIndex,
                                  querySpec
                                )
                        }
                        onLoad={onLoad}
                        onRemove={
                          typeof handleRemove === 'function'
                            ? (): void => handleRemove(categoryIndex, itemIndex)
                            : undefined
                        }
                        onRename={
                          typeof handleRename === 'function'
                            ? (newLabel): void => {
                                handleRename(
                                  categoryIndex,
                                  itemIndex,
                                  newLabel
                                );
                              }
                            : undefined
                        }
                      />
                    ) : undefined
                  )
                ) : (
                  <ItemOverride item={items[0]} />
                )}
              </Ul>
              {typeof handleCategoryRename === 'function' ? (
                <span className="-mt-2 flex-1" />
              ) : null}
              {typeof handleAdd === 'function' ? (
                <div className="flex gap-2">
                  <Button.Small
                    variant={className.borderedGrayButton}
                    onClick={(): void =>
                      handleRemove?.(categoryIndex, undefined)
                    }
                  >
                    {statsText.deleteCategory()}
                  </Button.Small>
                  <span className="-ml-2 flex-1" />
                  <Button.Small
                    variant={className.infoButton}
                    onClick={(): void => handleAdd(categoryIndex)}
                  >
                    {commonText.add()}
                  </Button.Small>
                </div>
              ) : null}
            </li>
          )
      )}

      {handleAdd !== undefined && (
        <Button.Secondary
          className="!p-4 font-bold shadow-md shadow-gray-300"
          onClick={(): void => handleAdd(undefined)}
        >
          {statsText.addACategory()}
        </Button.Secondary>
      )}
    </>
  );
}
