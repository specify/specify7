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
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { statsText } from '../../localization/stats';
import { urlSpec } from './definitions';

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
        value: number | string
      ) => void)
    | undefined;
  readonly onItemRename:
    | ((categoryIndex: number, itemIndex: number, newLabel: string) => void)
    | undefined;
}): JSX.Element {
  const checkEmptyItems = handleSpecChanged === undefined;
  const [removeCategoryIndex, setRemoveCategoryIndex] = React.useState<
    number | undefined
  >(undefined);
  const closeRemoveDialog = (): void => {
    setRemoveCategoryIndex(undefined);
  };

  /**
   *If checkEmptyItems is false, show category. Else, check if category contains custom stats
   * or if it contains default stats which aren't isVisible as false
   */
  const shouldShowCategory = (
    items: RA<CustomStat | DefaultStat> | undefined
  ): boolean =>
    !checkEmptyItems ||
    (items ?? []).some(
      (item) => item.type === 'CustomStat' || item.isVisible === undefined
    );
  return pageLayout === undefined ? (
    <></>
  ) : (
    <>
      {pageLayout.categories.map(
        ({ label, items }, categoryIndex) =>
          shouldShowCategory(items) && (
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
                  onValueChange={(newname): void =>
                    handleCategoryRename(newname, categoryIndex)
                  }
                />
              )}
              <Ul
                className={
                  handleItemRename === undefined
                    ? 'flex-1 overflow-auto'
                    : 'grid grid-cols-[auto_1fr_max-content] gap-2 overflow-auto'
                }
              >
                {items !== undefined
                  ? items.map((item, itemIndex) =>
                      item.type === 'CustomStat' ||
                      item.isVisible === undefined ? (
                        <StatItem
                          categoryIndex={categoryIndex}
                          item={item}
                          itemIndex={itemIndex}
                          key={itemIndex}
                          statsSpec={statsSpec}
                          onClick={
                            item.type === 'CustomStat'
                              ? undefined
                              : typeof handleClick === 'function'
                              ? checkEmptyItems
                                ? (): void =>
                                    handleClick({
                                      type: 'DefaultStat',
                                      pageName: item.pageName,
                                      categoryName: item.categoryName,
                                      itemName: item.itemName,
                                      itemLabel: item.itemLabel,
                                      itemValue: item.itemValue,
                                      itemType: item.itemType,
                                      pathToValue:
                                        item.itemType === 'BackEndStat' &&
                                        item.itemName === 'phantomItem'
                                          ? (item.itemLabel as keyof typeof urlSpec)
                                          : undefined,
                                    })
                                : undefined
                              : undefined
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
                          onRemove={
                            typeof handleRemove === 'function'
                              ? (): void =>
                                  handleRemove(categoryIndex, itemIndex)
                              : undefined
                          }
                          onSpecChanged={
                            !checkEmptyItems
                              ? item.type === 'DefaultStat'
                                ? handleClick !== undefined
                                  ? (querySpec, itemName): void => {
                                      handleClick(
                                        {
                                          type: 'CustomStat',
                                          itemLabel: itemName,
                                          tableName: querySpec.tableName,
                                          fields: querySpec.fields,
                                        },
                                        categoryIndex,
                                        itemIndex
                                      );
                                    }
                                  : undefined
                                : (querySpec) =>
                                    handleSpecChanged(
                                      categoryIndex,
                                      itemIndex,
                                      querySpec.fields
                                    )
                              : undefined
                          }
                          onValueLoad={handleValueLoad}
                        />
                      ) : undefined
                    )
                  : commonText.loading()}
              </Ul>
              {typeof handleCategoryRename === 'function' ? (
                <span className="-mt-2 flex-1" />
              ) : null}
              {typeof handleAdd === 'function' &&
              typeof handleRemove === 'function' ? (
                <div className="flex gap-2">
                  <Button.Small
                    variant={className.blueButton}
                    onClick={(): void => handleAdd(categoryIndex)}
                  >
                    {commonText.add()}
                  </Button.Small>
                  <span className="-ml-2 flex-1" />
                  <Button.Small
                    variant={className.redButton}
                    onClick={(): void => {
                      const containsCustom =
                        pageLayout.categories[categoryIndex].items === undefined
                          ? false
                          : (pageLayout.categories[categoryIndex].items?.some(
                              (item) => item.type === 'CustomStat'
                            ) as boolean);
                      if (containsCustom) setRemoveCategoryIndex(categoryIndex);
                      else {
                        handleRemove(categoryIndex, undefined);
                      }
                    }}
                  >
                    {statsText.deleteAll()}
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
          {commonText.add()}
        </Button.Gray>
      )}
      {removeCategoryIndex !== undefined && (
        <Dialog
          header="Category Contains Custom Statistics"
          buttons={
            <div className="flex flex-row gap-2">
              <Button.Red
                onClick={(): void => {
                  handleRemove?.(removeCategoryIndex, undefined);
                  closeRemoveDialog();
                }}
              >
                {commonText.delete()}
              </Button.Red>
              <span className="-ml-2 flex" />
              <Button.Blue onClick={closeRemoveDialog}>
                {commonText.cancel()}
              </Button.Blue>
            </div>
          }
          className={{ container: dialogClassNames.narrowContainer }}
          onClose={closeRemoveDialog}
        >
          {statsText.customDeleteWarning()}
        </Dialog>
      )}
    </>
  );
}
