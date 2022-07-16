import React from 'react';

import type { SpLocaleContainerItem } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { sortFunction, split } from '../helpers';
import { commonText } from '../localization/common';
import type { SpecifyModel } from '../specifymodel';
import type { RA } from '../types';
import { H3, Select } from './basic';
import { useId } from './hooks';

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
  const [fields, relationships] = split(
    sortedItems,
    (item) => model.getField(item.name)!.isRelationship
  );
  return (
    <SchemaConfigColumn id={id('fields-label')} header={commonText('fields')}>
      <Select
        className="h-full min-h-[30vh] overflow-y-auto sm:min-h-0"
        size={2}
        aria-labelledby={id('fields-label')}
        value={index}
        onValueChange={(index): void => handleChange(Number.parseInt(index))}
        disabled={!Array.isArray(items)}
      >
        <optgroup label={commonText('fields')}>
          {fields.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </optgroup>
        {relationships.length > 0 && (
          <optgroup label={commonText('relationships')}>
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
  readonly header: string;
  readonly id?: string;
}): JSX.Element {
  return (
    <section className="-m-1 flex flex-1 flex-col gap-4 p-1 sm:overflow-y-auto">
      <H3 id={id}>{header}</H3>
      {children}
    </section>
  );
}
