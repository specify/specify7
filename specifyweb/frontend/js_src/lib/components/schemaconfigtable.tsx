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
  readonly name: SpLocaleItemString | NewSpLocaleItemString | undefined;
  readonly onChangeName: (
    containerName: SpLocaleItemString | NewSpLocaleItemString
  ) => void;
  readonly desc: SpLocaleItemString | NewSpLocaleItemString | undefined;
  readonly onChangeDesc: (
    containerName: SpLocaleItemString | NewSpLocaleItemString
  ) => void;
}): JSX.Element {
  return (
    <SchemaConfigColumn
      header={`${commonText('tableInline')} ${container.name}`}
    >
      <Label.Generic>
        {commonText('caption')}
        <Input.Text
          value={name?.text ?? ''}
          onValueChange={(text): void => handleChangeName({ ...name!, text })}
          isReadOnly={isReadOnly || name === undefined}
          maxLength={maxSchemaValueLength}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('description')}
        <AutoGrowTextArea
          className="resize-y"
          value={desc?.text ?? ''}
          onValueChange={(text): void => handleChangeDesc({ ...desc!, text })}
          isReadOnly={isReadOnly || desc === undefined}
          maxLength={maxSchemaValueLength}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('tableFormat')}
        <PickList
          value={container.format}
          groups={{
            '': filterFormatters(
              schemaData.formatters,
              container.name as keyof Tables
            ),
          }}
          onChange={(format): void => handleChange({ ...container, format })}
          disabled={isReadOnly}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('tableAggregation')}
        <PickList
          value={container.aggregator}
          groups={{
            '': filterFormatters(
              schemaData.aggregators,
              container.name as keyof Tables
            ),
          }}
          onChange={(aggregator): void =>
            handleChange({ ...container, aggregator })
          }
          disabled={isReadOnly}
        />
      </Label.Generic>
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={container.isHidden}
          onValueChange={(isHidden): void =>
            handleChange({ ...container, isHidden })
          }
          isReadOnly={isReadOnly}
        />
        {commonText('hideTable')}
      </Label.ForCheckbox>
    </SchemaConfigColumn>
  );
}
