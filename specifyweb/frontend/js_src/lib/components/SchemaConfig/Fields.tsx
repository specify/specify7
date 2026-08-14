import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
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
  const [sortField, setSortField] = React.useState<SortField>('isHidden');
  const [isDescending, setIsDescending] = React.useState(false);

  const handleSort = (field: SortField): void => {
    if (sortField === field) setIsDescending(!isDescending);
    else {
      setSortField(field);
      setIsDescending(false);
    }
  };

  const sortedItems = React.useMemo(
    () =>
      Object.values(items ?? []).sort(
        sortFunction(getSortValue(sortField), isDescending)
      ),
    [items, sortField, isDescending]
  );

  const [fields, relationships] = split(
    sortedItems,
    (item) => table.getField(item.name)!.isRelationship
  );

  return (
    <SchemaConfigColumn header={schemaText.fields()} id={id('fields-label')}>
      {typeof items === 'undefined' ? (
        commonText.loading()
      ) : (
        <div className="flex flex-col gap-6 overflow-y-auto">
          <SchemaConfigFieldsTable
            index={index}
            isDescending={isDescending}
            items={items}
            onChange={handleChange}
            onSort={handleSort}
            rows={fields}
            sortField={sortField}
            title={schemaText.literalFields()}
          />
          {relationships.length > 0 && (
            <SchemaConfigFieldsTable
              index={index}
              isDescending={isDescending}
              items={items}
              onChange={handleChange}
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
  items,
  index,
  sortField,
  isDescending,
  onSort: handleSort,
  onChange: handleChange,
}: {
  readonly title: LocalizedString;
  readonly rows: RA<SchemaConfigItem>;
  readonly items: RA<SchemaConfigItem> | undefined;
  readonly index: number;
  readonly sortField: SortField;
  readonly isDescending: boolean;
  readonly onSort: (field: SortField) => void;
  readonly onChange: (index: number) => void;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <H3>{title}</H3>
      <table className="w-full border-collapse text-left">
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
              isDescending={isDescending}
              label={getField(tables.SpLocaleContainerItem, 'isHidden').label}
              onSort={handleSort}
              sortField={sortField}
            />
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => {
            const itemIndex =
              items?.findIndex(({ id }) => id === item.id) ?? -1;
            const isCurrent = itemIndex === index;
            return (
              <tr
                className={`cursor-pointer border-b ${
                  isCurrent
                    ? 'bg-brand-100 dark:bg-brand-400'
                    : 'hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
                key={item.id}
                onClick={(): void => handleChange(itemIndex)}
              >
                <td className="p-1">
                  <Button.LikeLink
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={(event): void => {
                      event.stopPropagation();
                      handleChange(itemIndex);
                    }}
                  >
                    {localized(item.name)}
                  </Button.LikeLink>
                </td>
                <td className="p-1">{item.strings.name.text}</td>
                <td className="p-1">
                  {item.isHidden ? (
                    <>
                      <span aria-hidden>✓</span>
                      <span className="sr-only">{schemaText.hidden()}</span>
                    </>
                  ) : (
                    <span className="sr-only">{schemaText.visible()}</span>
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
}: {
  readonly field: SortField;
  readonly label: LocalizedString;
  readonly sortField: SortField;
  readonly isDescending: boolean;
  readonly onSort: (field: SortField) => void;
}): JSX.Element {
  const isActive = sortField === field;
  return (
    <th
      aria-sort={
        isActive ? (isDescending ? 'descending' : 'ascending') : undefined
      }
      className="p-1 font-bold"
      scope="col"
    >
      <button
        className="inline-flex items-center gap-1"
        type="button"
        onClick={(): void => handleSort(field)}
      >
        {label}
        {isActive ? (
          <span aria-hidden>{isDescending ? '↓' : '↑'}</span>
        ) : undefined}
      </button>
    </th>
  );
}

export function SchemaConfigColumn({
  children,
  header,
  id,
}: {
  readonly children: React.ReactNode;
  readonly header: LocalizedString;
  readonly id?: string;
}): JSX.Element {
  return (
    <section className="-m-1 flex flex-1 flex-col gap-4 p-1 sm:overflow-y-auto">
      <H3 id={id}>{header}</H3>
      {children}
    </section>
  );
}
