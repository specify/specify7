import React from 'react';

import type { SpLocaleContainerItem } from '../DataModel/types';
import { f } from '../../utils/functools';
import { KEY, sortFunction, split } from '../../utils/utils';
import { commonText } from '../../localization/common';
import { hasToolPermission } from '../Permissions/helpers';
import { getItemType, isFormatterAvailable } from './helpers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { IR, RA, RR } from '../../utils/types';
import type { ItemType } from './index';
import { PickList } from './Components';
import type { SchemaData } from './SetupHooks';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { Link } from '../Atoms/Link';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { useId } from '../../hooks/useId';
import { SerializedResource } from '../DataModel/helperTypes';
import { schemaText } from '../../localization/schema';

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
      <legend>{schemaText('fieldFormat')}</legend>
      {Object.entries<
        RR<
          ItemType,
          {
            readonly label: string;
            readonly value: string | null;
            readonly values:
              | IR<RA<readonly [key: string, value: string]>>
              | undefined;
            readonly extraComponents?: JSX.Element;
          }
        >
      >({
        none: {
          label: commonText('none'),
          value: null,
          values: undefined,
        },
        formatted: {
          label: schemaText('formatted'),
          value: item.format,
          values: {
            '': schemaData.uiFormatters
              .map(
                ({ name, isSystem, value }) =>
                  [
                    name,
                    `${name} ${value}${
                      isSystem ? ` (${schemaText('system')})` : ''
                    }`,
                  ] as const
              )
              .sort(sortFunction((value) => value[1])),
          },
        },
        webLink: {
          label: schemaText('webLink'),
          value: item.webLinkName,
          values: { '': schemaData.webLinks },
        },
        // REFACTOR: replace with a Query Combo Box?
        pickList: {
          label: schemaText('pickList'),
          value: item.pickListName,
          values: {
            [schemaText('userDefined')]: userPickLists,
            [schemaText('system')]: systemPickLists,
          },
          extraComponents: (
            <>
              {typeof currentPickListId === 'string' &&
              hasToolPermission('pickLists', 'read') ? (
                <Link.Icon
                  aria-label={commonText('edit')}
                  className={className.dataEntryEdit}
                  href={`/specify/view/picklist/${currentPickListId}/`}
                  icon="pencil"
                  title={commonText('edit')}
                />
              ) : undefined}
              {hasToolPermission('pickLists', 'create') && (
                <Link.Icon
                  aria-label={commonText('add')}
                  className={className.dataEntryAdd}
                  href="/specify/view/picklist/new/"
                  icon="plus"
                  title={commonText('add')}
                />
              )}
            </>
          ),
        },
      }).map(([key, { label, value, values, extraComponents }]) => (
        <div className={className.labelForCheckbox} key={key}>
          <Label.Inline>
            <Input.Radio
              checked={key === getItemType(item)}
              disabled={!isFormatterAvailable(field, key as ItemType)}
              isReadOnly={isReadOnly}
              name={id('format')}
              value="none"
              onChange={(): void =>
                handleFormatted(
                  key as ItemType,
                  typeof values === 'object'
                    ? Object.values(values)[0][0][0]! ?? null
                    : null
                )
              }
            />
            {label}
          </Label.Inline>
          {values && (
            <PickList
              className="w-0 flex-1"
              disabled={isReadOnly || !isFormatterAvailable(field, key)}
              groups={values}
              label={label}
              value={value}
              onChange={(value): void => handleFormatted(key, value)}
            />
          )}
          {extraComponents}
        </div>
      ))}
    </fieldset>
  );
}
