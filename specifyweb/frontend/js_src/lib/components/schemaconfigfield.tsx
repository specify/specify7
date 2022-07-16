import React from 'react';

import type { SpLocaleContainerItem } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { javaTypeToHuman } from '../schemaconfighelper';
import type { LiteralField, Relationship } from '../specifyfield';
import { Input, Label } from './basic';
import { AutoGrowTextArea } from './common';
import type { ItemType } from './schemaconfig';
import { SchemaConfigColumn } from './schemaconfigfields';
import { SchemaConfigFormat } from './schemaconfigformat';
import type { SchemaData } from './schemaconfigsetuphooks';
import { maxSchemaValueLength } from './schemaconfigtable';
import type { WithFetchedStrings } from './toolbar/schemaconfig';

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
    field: 'name' | 'desc' | 'isHidden' | 'isRequired',
    value: string | boolean
  ) => void;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const canChangeIsRequired =
    !field.overrides.isRequired && !field.isRelationship;
  return (
    <SchemaConfigColumn header={`${commonText('field')}: ${item.name}`}>
      <Label.Generic>
        {commonText('caption')}
        <Input.Text
          value={item.strings.name.text}
          onValueChange={(value): void => handleChange('name', value)}
          isReadOnly={isReadOnly}
          maxLength={maxSchemaValueLength}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('description')}
        <AutoGrowTextArea
          className="resize-y"
          value={item.strings.desc.text}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('desc', value)}
          maxLength={maxSchemaValueLength}
        />
      </Label.Generic>
      <Label.Generic>
        {commonText('length')}
        <Input.Number value={field.length ?? ''} isReadOnly />
      </Label.Generic>
      <Label.Generic>
        {commonText('type')}
        <Input.Text
          isReadOnly
          value={javaTypeToHuman(
            field.type,
            field.isRelationship ? field.relatedModel.name : undefined
          )}
        />
      </Label.Generic>
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={item.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isHidden', value)}
        />
        {commonText('hideField')}
      </Label.ForCheckbox>
      <Label.ForCheckbox>
        <Input.Checkbox
          checked={
            canChangeIsRequired ? item.isRequired ?? false : field.isRequired
          }
          disabled={!canChangeIsRequired}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isRequired', value)}
        />
        {commonText('required')}
      </Label.ForCheckbox>
      <SchemaConfigFormat
        schemaData={schemaData}
        field={field}
        item={item}
        onFormatted={handleFormatted}
        isReadOnly={isReadOnly}
      />
    </SchemaConfigColumn>
  );
}
