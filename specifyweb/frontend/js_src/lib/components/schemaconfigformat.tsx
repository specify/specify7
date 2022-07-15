import React from 'react';

import type { SpLocaleContainerItem } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import { KEY, sortFunction, split } from '../helpers';
import { commonText } from '../localization/common';
import { hasToolPermission } from '../permissionutils';
import { getItemType, isFormatterAvailable } from '../schemaconfighelper';
import type { LiteralField, Relationship } from '../specifyfield';
import type { IR, RA, RR } from '../types';
import { className, Input, Label, Link } from './basic';
import { useId } from './hooks';
import type { ItemType } from './schemaconfig';
import { PickList } from './schemaconfigcomponents';
import type { SchemaData } from './schemaconfigsetuphooks';
import type { WithFetchedStrings } from './toolbar/schemaconfig';

export function SchemaConfigFormat({
  schemaData,
  field,
  item,
  onFormatted: handleFormatted,
  isReadOnly,
}: {
  readonly schemaData: SchemaData;
  readonly field: LiteralField | Relationship;
  readonly item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const id = useId('schema-config-field');
  const [userPickLists, systemPickLists] = split(
    Object.values(schemaData.pickLists),
    ({ isSystem }) => isSystem
  ).map((group) =>
    group
      .map(({ name }) => name)
      .sort(sortFunction(f.id))
      .map((name) => [name, name] as const)
  );
  const currentPickListId = Object.entries(schemaData.pickLists).find(
    ([_id, { name }]) => name === item.pickListName
  )?.[KEY];
  return (
    <fieldset className="flex flex-col gap-1">
      <legend>{commonText('fieldFormat')}</legend>
      {Object.entries<
        RR<
          ItemType,
          {
            label: string;
            value: string | null;
            values: IR<RA<Readonly<[key: string, value: string]>>> | undefined;
            extraComponents?: JSX.Element;
          }
        >
      >({
        none: {
          label: commonText('none'),
          value: null,
          values: undefined,
        },
        formatted: {
          label: commonText('formatted'),
          value: item.format,
          values: {
            '': schemaData.uiFormatters
              .map(
                ({ name, isSystem, value }) =>
                  [
                    name,
                    `${name} ${value}${
                      isSystem ? ` (${commonText('system')})` : ''
                    }`,
                  ] as const
              )
              .sort(sortFunction((value) => value[1])),
          },
        },
        webLink: {
          label: commonText('webLink'),
          value: item.webLinkName,
          values: { '': schemaData.webLinks },
        },
        // REFACTOR: replace with a Query Combo Box?
        pickList: {
          label: commonText('pickList'),
          value: item.pickListName,
          values: {
            [commonText('userDefined')]: userPickLists,
            [commonText('system')]: systemPickLists,
          },
          extraComponents: (
            <>
              {typeof currentPickListId === 'string' &&
              hasToolPermission('pickLists', 'read') ? (
                <Link.Icon
                  icon="pencil"
                  title={commonText('edit')}
                  aria-label={commonText('edit')}
                  className={className.dataEntryEdit}
                  href={`/specify/view/picklist/${currentPickListId}/`}
                />
              ) : undefined}
              {hasToolPermission('pickLists', 'create') && (
                <Link.Icon
                  icon="plus"
                  href="/specify/view/picklist/new/"
                  className={className.dataEntryAdd}
                  title={commonText('add')}
                  aria-label={commonText('add')}
                />
              )}
            </>
          ),
        },
      }).map(([key, { label, value, values, extraComponents }]) => (
        <div className={className.labelForCheckbox} key={key}>
          <Label.ForCheckbox>
            <Input.Radio
              name={id('format')}
              value="none"
              checked={key === getItemType(item)}
              disabled={!isFormatterAvailable(field, key as ItemType)}
              onChange={(): void =>
                handleFormatted(
                  key as ItemType,
                  typeof values === 'object'
                    ? Object.values(values)[0][0][0]! ?? null
                    : null
                )
              }
              isReadOnly={isReadOnly}
            />
            {label}
          </Label.ForCheckbox>
          {values && (
            <PickList
              className="flex-1 w-0"
              label={label}
              value={value}
              groups={values}
              disabled={isReadOnly || !isFormatterAvailable(field, key)}
              onChange={(value): void => handleFormatted(key, value)}
            />
          )}
          {extraComponents}
        </div>
      ))}
    </fieldset>
  );
}
