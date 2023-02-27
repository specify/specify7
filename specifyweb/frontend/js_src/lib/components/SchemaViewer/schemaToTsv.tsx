import { formsText } from '../../localization/forms';
import { schemaText } from '../../localization/schema';
import { booleanFormatter } from '../../utils/parser/parse';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import {
  javaTypeToHuman,
  localizedRelationshipTypes,
} from '../SchemaConfig/helpers';

export const schemaToTsv = (): string =>
  [
    [
      schemaText.table(),
      schemaText.fieldLabel(),
      getField(schema.models.SpLocaleContainer, 'isSystem').label,
      getField(schema.models.SpLocaleContainer, 'isHidden').label,
      schemaText.tableId(),
      getField(schema.models.SpLocaleContainerItem, 'name').label,
      schemaText.fieldLabel(),
      schemaText.description(),
      getField(schema.models.SpLocaleContainerItem, 'isHidden').label,
      schemaText.readOnly(),
      getField(schema.models.SpLocaleContainerItem, 'isRequired').label,
      formsText.relationship(),
      getField(schema.models.SpLocaleContainerItem, 'type').label,
      schemaText.fieldLength(),
      schemaText.databaseColumn(),
      schemaText.relatedModel(),
      schemaText.otherSideName(),
      schemaText.dependent(),
    ],
    ...Object.values(schema.models).flatMap((model) => {
      const commonColumns = [
        model.name,
        model.label.replace('\n', ' '),
        booleanFormatter(model.isSystem),
        booleanFormatter(model.isHidden),
        model.tableId,
      ];
      return [
        ...model.literalFields.map((field) => [
          ...commonColumns,
          field.name,
          field.label.replace('\n', ' '),
          field.getLocalizedDesc(),
          booleanFormatter(field.isHidden),
          booleanFormatter(field.isReadOnly),
          booleanFormatter(field.isRequired),
          booleanFormatter(false),
          javaTypeToHuman(field.type, undefined),
          field.length,
          field.databaseColumn,
          '',
          '',
          '',
        ]),
        ...model.relationships.map((relationship) => [
          ...commonColumns,
          relationship.name,
          relationship.label.replace('\n', ' '),
          relationship.getLocalizedDesc(),
          booleanFormatter(relationship.isHidden),
          booleanFormatter(relationship.isReadOnly),
          booleanFormatter(relationship.isRequired),
          booleanFormatter(true),
          localizedRelationshipTypes[relationship.type] ?? relationship.type,
          '',
          relationship.databaseColumn,
          relationship.relatedModel.name,
          relationship.otherSideName,
          booleanFormatter(relationship.isDependent()),
        ]),
      ];
    }),
  ]
    .map((line) => line.join('\t'))
    .join('\n');
