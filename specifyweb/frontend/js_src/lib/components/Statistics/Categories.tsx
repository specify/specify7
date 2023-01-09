import type { CustomStat, DefaultStat, StatLayout, StatsSpec } from './types';
import { H3, Ul } from '../Atoms';
import { Input } from '../Atoms/Form';
import { StatItem } from './StatItems';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { commonText } from '../../localization/common';
import React from 'react';
import { RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { SpQueryField } from '../DataModel/types';

export function Categories({
  pageLayout,
  statsSpec,
  onAdd: handleAdd,
  onClick: handleClick,
  onRemove: handleRemove,
  onCategoryRename: handleCategoryRename,
  onItemRename: handleItemRename,
  onSpecChanged: handleSpecChanged,
  onValueLoad: handleValueLoad,
}: {
  readonly pageLayout: StatLayout[number] | undefined;
  readonly statsSpec: StatsSpec;
  readonly onAdd: ((categoryIndex: number | undefined) => void) | undefined;
  readonly onClick:
    | ((
        item: CustomStat | DefaultStat,
        categoryIndex?: number,
        itemIndex?: number
      ) => void)
    | ((item: CustomStat | DefaultStat) => void)
    | undefined;
  readonly onRemove:
    | ((categoryIndex: number, itemIndex: number | undefined) => void)
    | undefined;
  readonly onCategoryRename:
    | ((newName: string, categoryIndex: number) => void)
    | undefined;
  readonly onSpecChanged:
    | ((
        categoryIndex: number,
        itemIndex: number,
        fields: RA<
          Partial<SerializedResource<SpQueryField>> & { readonly path: string }
        >
      ) => void)
    | undefined;
  readonly onValueLoad:
    | ((
        categoryIndex: number,
        itemIndex: number,
        value: number | string,
        itemLabel: string
      ) => void)
    | undefined;
  readonly onItemRename:
    | ((categoryIndex: number, itemIndex: number, newLabel: string) => void)
    | undefined;
}): JSX.Element {
  const checkEmptyItems = handleSpecChanged === undefined;
  return pageLayout === undefined ? (
    <></>
  ) : (
    <>
      {pageLayout.categories.map(
        ({ label, items }, categoryIndex) =>
          (!checkEmptyItems ||
            (items ?? []).some(
              (item) =>
                item.type === 'CustomStat' || item.isVisible === undefined
            )) && (
            <li
              className={`${
                checkEmptyItems
                  ? ''
                  : 'flex h-auto max-h-80 flex-col content-center gap-2 rounded border-[1px] bg-[color:var(--form-foreground)] p-4 shadow-lg shadow-gray-300 transition hover:shadow-md hover:shadow-gray-400'
              }`}
              key={categoryIndex}
            >
              {handleCategoryRename === undefined ? (
                !checkEmptyItems ? (
                  <H3 className="font-bold">{label}</H3>
                ) : (
                  <h5 className="font-semibold">{label}</h5>
                )
              ) : (
                <Input.Text
                  required
                  value={label}
                  onValueChange={(newname): void => {
                    handleCategoryRename(newname, categoryIndex);
                  }}
                />
              )}
              <Ul
                className={
                  handleItemRename === undefined
                    ? 'flex-1 overflow-auto'
                    : 'grid grid-cols-[auto_1fr_max-content] gap-2 overflow-auto '
                }
              >
                {items !== undefined
                  ? items.map((item, itemIndex) =>
                      item.type === 'CustomStat' ||
                      item.isVisible === undefined ? (
                        <StatItem
                          item={item}
                          categoryIndex={categoryIndex}
                          itemIndex={itemIndex}
                          key={itemIndex}
                          statsSpec={statsSpec}
                          onValueLoad={handleValueLoad}
                          onSpecChanged={
                            handleSpecChanged !== undefined
                              ? item.type === 'DefaultStat'
                                ? handleClick !== undefined
                                  ? (tableName, newFields, itemName): void => {
                                      handleClick(
                                        {
                                          type: 'CustomStat',
                                          itemLabel: itemName,
                                          tableName,
                                          fields: newFields,
                                        },
                                        categoryIndex,
                                        itemIndex
                                      );
                                    }
                                  : undefined
                                : (_, fields) =>
                                    handleSpecChanged(
                                      categoryIndex,
                                      itemIndex,
                                      fields
                                    )
                              : undefined
                          }
                          onClick={
                            item.type === 'CustomStat'
                              ? undefined
                              : typeof handleClick === 'function'
                              ? handleSpecChanged === undefined
                                ? (): void =>
                                    handleClick({
                                      type: 'DefaultStat',
                                      pageName: item.pageName,
                                      categoryName: item.categoryName,
                                      itemName: item.itemName,
                                      itemLabel: item.itemLabel,
                                      itemValue: item.itemValue,
                                      itemType: item.itemType,
                                    })
                                : undefined
                              : undefined
                          }
                          onRemove={
                            handleRemove === undefined
                              ? undefined
                              : (): void =>
                                  handleRemove(categoryIndex, itemIndex)
                          }
                          onItemRename={
                            typeof handleItemRename === 'function'
                              ? (newLabel): void => {
                                  handleItemRename(
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
                  : commonText('loading')}
              </Ul>
              {typeof handleCategoryRename === 'function' ? (
                <span className="-mt-2 flex-1" />
              ) : null}
              {handleAdd !== undefined && handleRemove !== undefined ? (
                <div className="flex gap-2">
                  <Button.Small
                    variant={className.blueButton}
                    onClick={(): void => handleAdd(categoryIndex)}
                  >
                    {commonText('add')}
                  </Button.Small>
                  <span className="-ml-2 flex-1" />
                  <Button.Small
                    variant={className.redButton}
                    onClick={(): void => handleRemove(categoryIndex, undefined)}
                  >
                    {'Delete All'}
                  </Button.Small>
                </div>
              ) : null}
            </li>
          )
      )}
      {handleAdd !== undefined && (
        <Button.Gray
          className="!p-4 font-bold shadow-md shadow-gray-300"
          onClick={(): void => handleAdd(undefined)}
        >
          {commonText('add')}
        </Button.Gray>
      )}
    </>
  );
}
