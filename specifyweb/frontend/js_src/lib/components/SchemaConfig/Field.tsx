import React from 'react';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { Input, Label } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { tables } from '../DataModel/tables';
import type { SpLocaleContainerItem } from '../DataModel/types';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import type { WithFetchedStrings } from '../Toolbar/SchemaConfig';
import { SchemaConfigColumn } from './Fields';
import { SchemaConfigFormat } from './Format';
import { javaTypeToHuman } from './helpers';
import type { ItemType } from './index';
import type { SchemaData } from './schemaData';
import { maxSchemaValueLength } from './Table';

export function SchemaConfigField({
  schemaData,
  field,
  item,
  onChange: handleChange,
  onFormatted: handleFormatted,
}: {
  readonly schemaData: SchemaData;
  readonly field: LiteralField | Relationship;
  readonly item: SerializedResource<SpLocaleContainerItem> & WithFetchedStrings;
  readonly onChange: (
    field: 'desc' | 'isHidden' | 'isRequired' | 'name',
    value: boolean | string
  ) => void;
  readonly onFormatted: (format: ItemType, value: string | null) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const canChangeIsRequired =
    !field.overrides.isRequired && !field.isRelationship;
  return (
    <SchemaConfigColumn
      header={commonText.colonLine({
        label: schemaText.field(),
        value: item.name,
      })}
    >
      <Label.Block>
        {schemaText.caption()}
        <Input.Text
          isReadOnly={isReadOnly}
          maxLength={maxSchemaValueLength}
          required
          value={item.strings.name.text}
          onValueChange={(value): void => handleChange('name', value)}
        />
      </Label.Block>
      <Label.Block>
        {schemaText.description()}
        <AutoGrowTextArea
          className="resize-y"
          isReadOnly={isReadOnly}
          maxLength={maxSchemaValueLength}
          value={item.strings.desc.text}
          onValueChange={(value): void => handleChange('desc', value)}
        />
      </Label.Block>
      <Label.Block>
        {schemaText.fieldLength()}
        <Input.Integer isReadOnly value={field.length ?? ''} />
      </Label.Block>
      <Label.Block>
        {resourcesText.type()}
        <Input.Text
          isReadOnly
          value={javaTypeToHuman(
            field.type,
            field.isRelationship ? field.relatedTable.name : undefined
          )}
        />
      </Label.Block>
      <Label.Inline>
        <Input.Checkbox
          checked={item.isHidden}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isHidden', value)}
        />
        {schemaText.hideField()}
      </Label.Inline>
      <Label.Inline>
        <Input.Checkbox
          checked={
            canChangeIsRequired ? (item.isRequired ?? false) : field.isRequired
          }
          disabled={!canChangeIsRequired}
          isReadOnly={isReadOnly}
          onValueChange={(value): void => handleChange('isRequired', value)}
        />
        {getField(tables.SpLocaleContainerItem, 'isRequired').label}
      </Label.Inline>
      <SchemaConfigFormat
        field={field}
        item={item}
        schemaData={schemaData}
        onFormatted={handleFormatted}
      />
    </SchemaConfigColumn>
  );
}
