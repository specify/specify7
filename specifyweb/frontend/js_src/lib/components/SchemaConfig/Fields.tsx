import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import type { RA } from '../../utils/types';
import { sortFunction, split } from '../../utils/utils';
import { H3 } from '../Atoms';
import { Select } from '../Atoms/Form';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpLocaleContainerItem } from '../DataModel/types';

export function SchemaConfigFields({
  model,
  items,
  index,
  onChange: handleChange,
}: {
  readonly model: SpecifyModel;
  readonly items: RA<SerializedResource<SpLocaleContainerItem>> | undefined;
  readonly index: number;
  readonly onChange: (index: number) => void;
}): JSX.Element {
  const id = useId('schema-fields');
  const sortedItems = Object.values(items ?? []).sort(
    sortFunction(({ name }) => name)
  );
  const currentId = items?.[index].id ?? 0;
  const [fields, relationships] = split(
    sortedItems,
    (item) => model.getField(item.name)!.isRelationship
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
          {fields.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </optgroup>
        {relationships.length > 0 && (
          <optgroup label={schemaText.relationships()}>
            {relationships.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
    </SchemaConfigColumn>
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
