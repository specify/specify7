import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Input, Label, Select } from '../Atoms/Form';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpLocaleContainerItem } from '../DataModel/types';

export function SchemaConfigFields({
  table,
  items,
  index,
  onChange: handleChange,
}: {
  readonly table: SpecifyTable;
  readonly items: RA<SerializedResource<SpLocaleContainerItem>> | undefined;
  readonly index: number;
  readonly onChange: (index: number) => void;
}): JSX.Element {
  const id = useId('schema-fields');
  const [isHiddenFirst = true, setIsHiddenFirst] = useCachedState(
    'schemaConfig',
    'sortByHiddenFields'
  );

  const sortedItems = React.useMemo(() => {
    const sorted = Object.values(items ?? []).sort(
      sortFunction(({ name }) => name)
    );
    return isHiddenFirst
      ? sorted.sort(sortFunction(({ isHidden }) => isHidden))
      : sorted;
  }, [items, isHiddenFirst]);

  const currentId = items?.[index].id ?? 0;
  const [fields, relationships] = split(
    sortedItems,
    (item) => table.getField(item.name)!.isRelationship
  );

  return (
    <SchemaConfigColumn header={schemaText.fields()} id={id('fields-label')}>
      <Select
        aria-labelledby={id('fields-label')}
        className="h-full min-h-[30vh] overflow-y-auto sm:min-h-0"
        disabled={!Array.isArray(items)}
        size={2}
        value={currentId}
        onValueChange={(newId): void =>
          handleChange(items!.findIndex(({ id }) => id.toString() === newId))
        }
      >
        <optgroup label={schemaText.fields()}>
          {items === undefined && (
            <option value="">{commonText.loading()}</option>
          )}
          <SchemaConfigFieldsList fields={fields} />
        </optgroup>

        {relationships.length > 0 && (
          <optgroup label={schemaText.relationships()}>
            <SchemaConfigFieldsList fields={relationships} />
          </optgroup>
        )}
      </Select>
      <Label.Inline>
        <Input.Checkbox
          checked={isHiddenFirst}
          onValueChange={() => setIsHiddenFirst(!isHiddenFirst)}
        />
        {schemaText.sortByHiddenFields()}
      </Label.Inline>
    </SchemaConfigColumn>
  );
}

export function SchemaConfigFieldsList({
  fields,
}: {
  readonly fields: RA<SerializedResource<SpLocaleContainerItem>>;
}): JSX.Element {
  return (
    <>
      {fields.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name} {item.isHidden ? `(${schemaText.hidden()})` : null}
        </option>
      ))}
    </>
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
