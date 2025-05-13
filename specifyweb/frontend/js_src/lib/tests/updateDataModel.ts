import { genericTables, tables } from '../components/DataModel/tables';
import { setDevelopmentGlobal } from '../utils/types';
import { group, sortFunction } from '../utils/utils';

const javaTypeToTypeScript = {
  text: 'string',
  json: 'string',
  blob: 'string',
  'java.lang.String': 'string',
  'java.lang.Byte': 'number',
  'java.lang.Short': 'number',
  'java.lang.Integer': 'number',
  'java.lang.Float': 'number',
  'java.lang.Double': 'number',
  'java.lang.Long': 'number',
  'java.math.BigDecimal': 'number',
  'java.lang.Boolean': 'boolean',
  'java.sql.Timestamp': 'string',
  'java.util.Calendar': 'string',
  'java.util.Date': 'string',
} as const;

const keyOrder = [
  'tableName',
  'fields',
  'toOneDependent',
  'toOneIndependent',
  'toManyDependent',
  'toManyIndependent',
];

function regenerate(): string {
  const index = `export type Tables = {${Object.keys(tables)
    .map((tableName) => `readonly ${tableName}: ${tableName}`)
    .join(';')}};`;
  const tableTypes = Object.entries(genericTables)
    .map(
      ([tableName, { literalFields, relationships }]) =>
        `export type ${tableName} = {${Object.entries({
          tableName: `'${tableName}'`,
          fields: literalFields.map(
            ({ type, name, isRequired }) =>
              `readonly ${name}:${javaTypeToTypeScript[type]}${
                isRequired ? '' : '|null'
              }`
          ),
          toOneDependent: 'RR<never, never>',
          toOneIndependent: 'RR<never, never>',
          toManyDependent: 'RR<never, never>',
          toManyIndependent: 'RR<never, never>',
          ...Object.fromEntries(
            group(
              relationships.map((relationship) => [
                `${
                  relationship.type.endsWith('-to-many') ? 'toMany' : 'toOne'
                }${
                  relationship.datamodelDefinition.dependent
                    ? 'Dependent'
                    : 'Independent'
                }`,
                `readonly ${relationship.name}:${
                  relationship.type.endsWith('-to-many')
                    ? `RA<${relationship.relatedTable.name}>`
                    : `${relationship.relatedTable.name}${
                        relationship.isRequired ? '' : '|null'
                      }`
                }`,
              ])
            )
          ),
        })
          .sort(sortFunction(([groupName]) => keyOrder.indexOf(groupName)))
          .map(
            ([group, fields]) =>
              `readonly ${group}: ${
                typeof fields === 'string' ? fields : `{${fields.join(';')}}`
              }`
          )
          .join(';')}}`
    )
    .join(';');
  return `${index}${tableTypes}`;
}

setDevelopmentGlobal('_regenerateSchema', (): void => {
  document.body.textContent = regenerate();
});
