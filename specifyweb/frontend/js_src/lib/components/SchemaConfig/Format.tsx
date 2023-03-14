import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { KEY, sortFunction, split } from '../../utils/utils';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { tables } from '../DataModel/tables';
import type { SpLocaleContainerItem } from '../DataModel/types';
import { ResourceLink } from '../Molecules/ResourceLink';
import { hasToolPermission } from '../Permissions/helpers';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { PickList } from './Components';
import { getItemType, isFormatterAvailable } from './helpers';
import type { ItemType } from './index';
import type { SchemaData } from './schemaData';
import { fetchSchemaPickLists } from './schemaData';

export function SchemaConfigFormat({
  schemaData,
  field,
  item,
  onFormatted: handleFormatted,
}: {
  readonly schemaData: SchemaData;
  readonly field: LiteralField | Relationship;
  readonly item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
}): JSX.Element {
  const [userPickLists, systemPickLists] = split(
    Object.values(schemaData.pickLists),
    ({ isSystem }) => isSystem
  ).map((group) =>
    group
      .map(({ name }) => name)
      .sort(sortFunction(f.id))
      .map((name) => [name, name] as const)
  );
  const id = useId('schema-config-field');

  const lineProps = { field, item, id, onFormatted: handleFormatted };
  return (
    <fieldset className="flex flex-col gap-1">
      <legend>{schemaText.fieldFormat()}</legend>
      <FormatterLine
        {...lineProps}
        label={commonText.none()}
        name="none"
        value={null}
        values={undefined}
      />
      <FormatterLine
        {...lineProps}
        label={schemaText.formatted()}
        name="formatted"
        value={item.format}
        values={{
          '': schemaData.uiFormatters
            .map(
              ({ name, isSystem, value }) =>
                [
                  name,
                  `${name} ${value}${
                    isSystem
                      ? ` (${
                          getField(tables.SpLocaleContainerItem, 'isSystem')
                            .label
                        })`
                      : ''
                  }`,
                ] as const
            )
            .sort(sortFunction((value) => value[1])),
        }}
      />
      <FormatterLine
        {...lineProps}
        label={schemaText.webLink()}
        name="webLink"
        value={item.webLinkName}
        values={{
          '': schemaData.webLinks,
        }}
      />
      <FormatterLine
        /*
         * This is used for a purpose similar to that of combo box, but can't
         * use a query combo box as it works based on IDs, but for pick lists
         * schema config uses names, not IDs ((
         */
        {...lineProps}
        extraComponents={
          <PickListEditing
            schemaData={schemaData}
            value={item.pickListName}
            onChange={(value): void => handleFormatted('pickList', value)}
          />
        }
        label={tables.PickList.label}
        name="pickList"
        value={item.pickListName}
        values={{
          [schemaText.userDefined()]: userPickLists,
          [getField(tables.SpLocaleContainerItem, 'isSystem').label]:
            systemPickLists,
        }}
      />
    </fieldset>
  );
}

function FormatterLine({
  name,
  label,
  value,
  values,
  extraComponents,
  field,
  item,
  id,
  onFormatted: handleFormatted,
}: {
  readonly name: ItemType;
  readonly label: LocalizedString;
  readonly value: string | null;
  readonly values: IR<RA<readonly [key: string, value: string]>> | undefined;
  readonly extraComponents?: JSX.Element;
  readonly field: LiteralField | Relationship;
  readonly item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings;
  readonly id: (suffix: string) => string;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <div className={className.labelForCheckbox}>
      <Label.Inline>
        <Input.Radio
          checked={name === getItemType(item)}
          disabled={!isFormatterAvailable(field, name)}
          isReadOnly={isReadOnly}
          name={id('format')}
          value="none"
          onChange={(): void =>
            handleFormatted(
              name,
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
          disabled={isReadOnly || !isFormatterAvailable(field, name)}
          groups={values}
          label={label}
          value={value}
          onChange={(value): void => handleFormatted(name, value)}
        />
      )}
      {extraComponents}
    </div>
  );
}

function PickListEditing({
  value,
  onChange: handleChange,
  schemaData,
}: {
  readonly value: string | null;
  readonly onChange: (value: string | null) => void;
  readonly schemaData: SchemaData;
}): JSX.Element {
  const currentPickList = React.useMemo(() => {
    const id = f.parseInt(
      Object.entries(schemaData.pickLists).find(
        ([_id, { name }]) => name === value
      )?.[KEY]
    );
    return typeof id === 'number'
      ? new tables.PickList.Resource({ id })
      : undefined;
  }, [schemaData.pickLists, value]);

  const [newPickList, setNewPickList] = React.useState(
    () => new tables.PickList.Resource()
  );
  const loading = React.useContext(LoadingContext);
  const handleChanged = (): void =>
    loading(
      fetchSchemaPickLists().then((pickLists) => {
        setNewPickList(new tables.PickList.Resource());
        schemaData.update({
          ...schemaData,
          pickLists,
        });
      })
    );
  const resourceView = {
    onSaved: handleChanged,
    onDeleted: handleChanged,
  } as const;
  return (
    <>
      {typeof currentPickList === 'object' &&
      hasToolPermission('pickLists', 'read') ? (
        <ResourceLink
          component={Link.Icon}
          resource={currentPickList}
          props={{
            title: commonText.edit(),
            icon: 'pencil',
            className: className.dataEntryEdit,
          }}
          resourceView={{
            onDeleted(): void {
              handleChange(null);
              resourceView.onDeleted();
            },
            onSaved(): void {
              handleChange(currentPickList.get('name'));
              resourceView.onSaved();
            },
          }}
        />
      ) : undefined}
      {hasToolPermission('pickLists', 'create') && (
        <ResourceLink
          component={Link.Icon}
          props={{
            title: commonText.add(),
            icon: 'plus',
            className: className.dataEntryAdd,
          }}
          resource={newPickList}
          resourceView={{
            ...resourceView,
            onSaved: (): void => {
              handleChange(newPickList.get('name'));
              resourceView.onSaved();
            },
          }}
        />
      )}
    </>
  );
}
