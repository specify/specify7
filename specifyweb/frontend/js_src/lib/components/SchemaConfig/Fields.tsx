import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { multiSortFunction, split } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { SpLocaleContainerItem } from '../DataModel/types';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';

type SchemaConfigItem = SerializedResource<SpLocaleContainerItem> &
  WithFetchedStrings;

type SortField = 'caption' | 'isHidden' | 'name';

export function SchemaConfigFields({
  table,
  items,
  index,
  onChange: handleChange,
}: {
  readonly table: SpecifyTable;
  readonly items: RA<SchemaConfigItem> | undefined;
  readonly index: number;
  readonly onChange: (index: number) => void;
}): JSX.Element {
  const id = useId('schema-fields');
  const [sortField, setSortField] = React.useState<SortField | undefined>(
    undefined
  );
  const [isDescending, setIsDescending] = React.useState(false);

  const handleSort = (field: SortField): void => {
    if (sortField === field) setIsDescending(!isDescending);
    else {
      setSortField(field);
      setIsDescending(false);
    }
  };

  const sortedItems = React.useMemo(() => {
    const itemList = Object.values(items ?? []);
    if (typeof sortField === 'undefined')
      return itemList.sort(
        multiSortFunction<SchemaConfigItem>(
          ({ isHidden }) => isHidden,
          ({ name }) => name
        )
      );
    return isDescending
      ? itemList.sort(
          multiSortFunction<SchemaConfigItem>(
            getSortValue(sortField),
            true,
            ({ name }) => name
          )
        )
      : itemList.sort(
          multiSortFunction<SchemaConfigItem>(
            getSortValue(sortField),
            ({ name }) => name
          )
        );
  }, [items, sortField, isDescending]);

  const [fields, relationships] = split(
    sortedItems,
    (item) => table.getField(item.name)!.isRelationship
  );

  const itemIndexes = React.useMemo(
    () =>
      new Map((items ?? []).map((item, index) => [item.id, index] as const)),
    [items]
  );

  // Navigate the fields list with the arrow keys!!!
  // Nice QoL and accessibility feature that matches the previous selectable list behavior pre-table.
  const listRef = React.useRef<HTMLDivElement | null>(null);
  // Follow the visual order instead of jumping between sections
  const sortedItemIndexes = React.useMemo(
    () =>
      [...fields, ...relationships].map(
        (item) => itemIndexes.get(item.id) ?? -1
      ),
    [fields, relationships, itemIndexes]
  );
  const currentPosition = sortedItemIndexes.indexOf(index);

  React.useEffect(() => {
    listRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const handleSelect = (newIndex: number): void => {
    handleChange(newIndex);
    listRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    const { key } = event;
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    if (sortedItemIndexes.length === 0) return;
    const last = sortedItemIndexes.length - 1;
    const current = currentPosition === -1 ? 0 : currentPosition;
    const next =
      key === 'ArrowDown'
        ? Math.min(current + 1, last)
        : key === 'ArrowUp'
          ? Math.max(current - 1, 0)
          : key === 'Home'
            ? 0
            : last;
    if (next !== currentPosition) handleChange(sortedItemIndexes[next]);
  };

  return (
    <SchemaConfigColumn
      className="flex-[2]"
      header={schemaText.fields()}
      id={id('fields-label')}
    >
      {typeof items === 'undefined' ? (
        commonText.loading()
      ) : (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          className="flex flex-col gap-4 overflow-y-auto [scrollbar-gutter:stable]"
          onKeyDown={handleKeyDown}
          ref={listRef}
          tabIndex={0}
        >
          <SchemaConfigFieldsTable
            index={index}
            isDescending={isDescending}
            itemIndexes={itemIndexes}
            onChange={handleSelect}
            onSort={handleSort}
            rows={fields}
            sortField={sortField}
            title={schemaText.literalFields()}
          />
          {relationships.length > 0 && (
            <SchemaConfigFieldsTable
              index={index}
              isDescending={isDescending}
              itemIndexes={itemIndexes}
              onChange={handleSelect}
              onSort={handleSort}
              rows={relationships}
              sortField={sortField}
              title={schemaText.relationships()}
            />
          )}
        </div>
      )}
    </SchemaConfigColumn>
  );
}

const getSortValue = (
  field: SortField
): ((item: SchemaConfigItem) => string | boolean) =>
  field === 'name'
    ? ({ name }) => name
    : field === 'caption'
      ? ({ strings }) => strings.name.text
      : ({ isHidden }) => isHidden;

function SchemaConfigFieldsTable({
  title,
  rows,
  itemIndexes,
  index,
  sortField,
  isDescending,
  onSort: handleSort,
  onChange: handleChange,
}: {
  readonly title: LocalizedString;
  readonly rows: RA<SchemaConfigItem>;
  readonly itemIndexes: ReadonlyMap<number, number>;
  readonly index: number;
  readonly sortField: SortField | undefined;
  readonly isDescending: boolean;
  readonly onSort: (field: SortField) => void;
  readonly onChange: (index: number) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1 rounded border border-neutral-400 p-1">
      <H3>{title}</H3>
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col />
          <col />
          <col className="w-12" />
        </colgroup>
        <thead>
          <tr className="border-b">
            <SortableTh
              field="name"
              isDescending={isDescending}
              label={getField(tables.SpLocaleContainerItem, 'name').label}
              onSort={handleSort}
              sortField={sortField}
            />
            <SortableTh
              field="caption"
              isDescending={isDescending}
              label={schemaText.caption()}
              onSort={handleSort}
              sortField={sortField}
            />
            <SortableTh
              field="isHidden"
              icon={icons.eye}
              isDescending={isDescending}
              label={schemaText.visible()}
              onSort={handleSort}
              sortField={sortField}
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const itemIndex = itemIndexes.get(item.id) ?? -1;
            const isCurrent = itemIndex === index;
            return (
              <tr
                className={`cursor-pointer border-b ${
                  item.isHidden ? 'italic' : ''
                } ${
                  isCurrent
                    ? 'bg-brand-100 dark:bg-brand-400'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
                key={item.id}
                onClick={(): void => handleChange(itemIndex)}
              >
                <td className="px-1 py-0.5 [overflow-wrap:anywhere]">
                  <Button.LikeLink
                    aria-current={isCurrent ? 'true' : undefined}
                    className={`${className.ariaHandled} ${
                      item.isHidden ? 'italic' : ''
                    }`}
                    onClick={(event): void => {
                      event.stopPropagation();
                      handleChange(itemIndex);
                    }}
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {localized(item.name)}
                    </span>
                  </Button.LikeLink>
                </td>
                <td className="px-1 py-0.5 [overflow-wrap:anywhere]">
                  {item.strings.name.text}
                </td>
                <td className="px-1 py-0.5">
                  {item.isHidden ? (
                    <>
                      <span className="text-red-500">{icons.x}</span>
                      <span className="sr-only">{schemaText.hidden()}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-500">{icons.check}</span>
                      <span className="sr-only">{schemaText.visible()}</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  field,
  label,
  sortField,
  isDescending,
  onSort: handleSort,
  icon,
}: {
  readonly field: SortField;
  readonly label: LocalizedString;
  readonly sortField: SortField | undefined;
  readonly isDescending: boolean;
  readonly onSort: (field: SortField) => void;
  readonly icon?: JSX.Element;
}): JSX.Element {
  const isActive = sortField === field;
  return (
    <th
      aria-sort={
        isActive ? (isDescending ? 'descending' : 'ascending') : undefined
      }
      className="px-1 py-0.5 font-bold"
      scope="col"
    >
      <button
        aria-label={icon === undefined ? undefined : label}
        className="flex w-full min-w-0 items-center gap-1"
        title={label}
        type="button"
        onClick={(): void => handleSort(field)}
      >
        {icon === undefined ? (
          <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
        ) : (
          <span
            aria-hidden
            className="flex shrink-0 items-center [&>svg]:h-4 [&>svg]:w-4"
          >
            {icon}
          </span>
        )}
        {isActive ? (
          <span aria-hidden className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">
            {isDescending ? icons.chevronDown : icons.chevronUp}
          </span>
        ) : undefined}
      </button>
    </th>
  );
}

export function SchemaConfigColumn({
  children,
  header,
  id,
  className: classNameOverride,
}: {
  readonly children: React.ReactNode;
  readonly header: LocalizedString;
  readonly id?: string;
  readonly className?: string;
}): JSX.Element {
  return (
    <section
      className={`-m-1 flex flex-col gap-4 p-1 sm:overflow-y-auto [scrollbar-gutter:stable] ${
        classNameOverride ?? 'flex-1'
      }`}
    >
      <H3 id={id}>{header}</H3>
      {children}
    </section>
  );
}
