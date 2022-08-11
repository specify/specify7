import React from 'react';

import type { SpLocaleContainer, Tables } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { schema } from '../schema';
import { filterFormatters } from '../schemaconfighelper';
import { defined } from '../types';
import { Input, Label } from './basic';
import { AutoGrowTextArea } from './common';
import type { NewSpLocaleItemString, SpLocaleItemString } from './schemaconfig';
import { PickList } from './schemaconfigcomponents';
import { SchemaConfigColumn } from './schemaconfigfields';
import type { SchemaData } from './schemaconfigsetuphooks';

export const maxSchemaValueLength = defined(
  schema.models.SpLocaleItemStr.getField('text')
).length;

export function SchemaConfigTable({
  schemaData,
  isReadOnly,
  container,
  name,
  desc,
  onChange: handleChange,
  onChangeName: handleChangeName,
  onChangeDesc: handleChangeDesc,
}: {
  readonly schemaData: SchemaData;
  readonly isReadOnly: boolean;
  readonly container: SerializedResource<SpLocaleContainer>;
  readonly onChange: (container: SerializedResource<SpLocaleContainer>) => void;
  readonly name: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly onChangeName: (
    containerName: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
  readonly desc: NewSpLocaleItemString | SpLocaleItemString | undefined;
  readonly onChangeDesc: (
    containerName: NewSpLocaleItemString | SpLocaleItemString
  ) => void;
}): JSX.Element {
  return (
    <SchemaConfigColumn
      header={`${commonText('tableInline')} ${container.name}`}
    >
      <Label.Generic>
        {commonText('caption')}
        <Input.Text
          isReadOnly={isReadOnly || name === undefined}
          maxLength={maxSchemaValueLength}
          required
          value={name?.text ?? ''}
          onValueChange={(text): void => handleChangeName({ ...name!, text })}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('description')}
        <AutoGrowTextArea
          className="resize-y"
          isReadOnly={isReadOnly || desc === undefined}
          maxLength={maxSchemaValueLength}
          value={desc?.text ?? ''}
          onValueChange={(text): void => handleChangeDesc({ ...desc!, text })}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('tableFormat')}
        <PickList
          disabled={isReadOnly}
          groups={{
            '': filterFormatters(
              schemaData.formatters,
              container.name as keyof Tables
            ),
          }}
          value={container.format}
          onChange={(format): void => handleChange({ ...container, format })}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('tableAggregation')}
        <PickList
          disabled={isReadOnly}
          groups={{
            '': filterFormatters(
              schemaData.aggregators,
              container.name as keyof Tables
            ),
          }}
          value={container.aggregator}
          onChange={(aggregator): void =>
            handleChange({ ...container, aggregator })
          }
        />
      </Label.Generic>
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={container.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(isHidden): void =>
            handleChange({ ...container, isHidden })
          }
        />
        {commonText('hideTable')}
      </Label.ForCheckbox>
    </SchemaConfigColumn>
  );
}
