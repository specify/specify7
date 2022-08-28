import React from 'react';

import type { SpLocaleContainerItem } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { commonText } from '../../localization/common';
import { javaTypeToHuman } from './helpers';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { AutoGrowTextArea } from '../Molecules';
import type { ItemType } from './index';
import { SchemaConfigColumn } from './Fields';
import { SchemaConfigFormat } from './Format';
import type { SchemaData } from './SetupHooks';
import { maxSchemaValueLength } from './Table';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { Input, Label } from '../Atoms/Form';

export function SchemaConfigField({
  schemaData,
  field,
  item,
  onChange: handleChange,
  onFormatted: handleFormatted,
  isReadOnly,
}: {
  readonly schemaData: SchemaData;
  readonly field: LiteralField | Relationship;
  readonly item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings;
  readonly onChange: (
    field: 'desc' | 'isHidden' | 'isRequired' | 'name',
    value: boolean | string
  ) => void;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const canChangeIsRequired =
    !field.overrides.isRequired && !field.isRelationship;
  return (
    <SchemaConfigColumn header={`${commonText('field')}: ${item.name}`}>
      <Label.Block>
        {commonText('caption')}
        <Input.Text
          isReadOnly={isReadOnly}
          maxLength={maxSchemaValueLength}
          required
          value={item.strings.name.text}
          onValueChange={(value): void => handleChange('name', value)}
        />
      </Label.Block>
      <Label.Block>
        {commonText('description')}
        <AutoGrowTextArea
          className="resize-y"
          isReadOnly={isReadOnly}
          maxLength={maxSchemaValueLength}
          value={item.strings.desc.text}
          onValueChange={(value): void => handleChange('desc', value)}
        />
      </Label.Block>
      <Label.Block>
        {commonText('length')}
        <Input.Number isReadOnly value={field.length ?? ''} />
      </Label.Block>
      <Label.Block>
        {commonText('type')}
        <Input.Text
          isReadOnly
          value={javaTypeToHuman(
            field.type,
            field.isRelationship ? field.relatedModel.name : undefined
          )}
        />
      </Label.Block>
      <Label.Inline>
        <Input.Checkbox
          checked={item.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isHidden', value)}
        />
        {commonText('hideField')}
      </Label.Inline>
      <Label.Inline>
        <Input.Checkbox
          checked={
            canChangeIsRequired ? item.isRequired ?? false : field.isRequired
          }
          disabled={!canChangeIsRequired}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isRequired', value)}
        />
        {commonText('required')}
      </Label.Inline>
      <SchemaConfigFormat
        field={field}
        isReadOnly={isReadOnly}
        item={item}
        schemaData={schemaData}
        onFormatted={handleFormatted}
      />
    </SchemaConfigColumn>
  );
}
