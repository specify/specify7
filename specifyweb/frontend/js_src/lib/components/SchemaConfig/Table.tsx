import React from 'react';

import type { SpLocaleContainer, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { commonText } from '../../localization/common';
import { schema } from '../DataModel/schema';
import { filterFormatters } from './helpers';
import { defined } from '../../utils/types';
import { AutoGrowTextArea } from '../Molecules';
import type { NewSpLocaleItemString, SpLocaleItemString } from './index';
import { PickList } from './Components';
import { SchemaConfigColumn } from './Fields';
import type { SchemaData } from './SetupHooks';
import { Input, Label } from '../Atoms/Form';

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
      <Label.Block>
        {commonText('caption')}
        <Input.Text
          isReadOnly={isReadOnly || name === undefined}
          maxLength={maxSchemaValueLength}
          required
          value={name?.text ?? ''}
          onValueChange={(text): void => handleChangeName({ ...name!, text })}
        />
      </Label.Block>
      <Label.Block>
        {commonText('description')}
        <AutoGrowTextArea
          className="resize-y"
          isReadOnly={isReadOnly || desc === undefined}
          maxLength={maxSchemaValueLength}
          value={desc?.text ?? ''}
          onValueChange={(text): void => handleChangeDesc({ ...desc!, text })}
        />
      </Label.Block>
      <Label.Block>
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
      </Label.Block>
      <Label.Block>
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
      </Label.Block>
      <Label.Inline>
        <Input.Checkbox
          checked={container.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(isHidden): void =>
            handleChange({ ...container, isHidden })
          }
        />
        {commonText('hideTable')}
      </Label.Inline>
    </SchemaConfigColumn>
  );
}
