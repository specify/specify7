import { formsText } from '../../localization/forms';
import { reportsText } from '../../localization/report';
import { schemaText } from '../../localization/schema';
import { booleanFormatter } from '../../utils/parser/parse';
import { getField } from '../DataModel/helpers';
import { genericTables, tables } from '../DataModel/tables';
import {
  javaTypeToHuman,
  localizedRelationshipTypes,
} from '../SchemaConfig/helpers';

export const schemaToTsv = (): string =>
  [
    [
      schemaText.table(),
      reportsText.labels(),
      getField(tables.SpLocaleContainer, 'isSystem').label,
      getField(tables.SpLocaleContainer, 'isHidden').label,
      schemaText.tableId(),
      getField(tables.SpLocaleContainerItem, 'name').label,
      reportsText.labels(),
      schemaText.description(),
      getField(tables.SpLocaleContainerItem, 'isHidden').label,
      schemaText.readOnly(),
      getField(tables.SpLocaleContainerItem, 'isRequired').label,
      formsText.relationship(),
      getField(tables.SpLocaleContainerItem, 'type').label,
      schemaText.fieldLength(),
      schemaText.databaseColumn(),
      schemaText.relatedTable(),
      schemaText.otherSideName(),
      schemaText.dependent(),
    ],
    ...Object.values(genericTables).flatMap((table) => {
      const commonColumns = [
        table.name,
        table.label.replace('\n', ' '),
        booleanFormatter(table.isSystem),
        booleanFormatter(table.isHidden),
        table.tableId,
      ];
      return [
        ...table.literalFields.map((field) => [
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
        ...table.relationships.map((relationship) => [
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
          relationship.relatedTable.name,
          relationship.otherSideName,
          booleanFormatter(relationship.isDependent()),
        ]),
      ];
    }),
  ]
    .map((line) => line.join('\t'))
    .join('\n');
