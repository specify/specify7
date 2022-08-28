import { group, sortFunction } from '../utils/utils';
import { schema } from '../components/DataModel/schema';

const javaTypeToTypeScript = {
  text: 'string',
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

export function regenerate(): string {
  const index = `export type Tables = {${Object.keys(schema.models)
    .map((tableName) => `readonly ${tableName}: ${tableName}`)
    .join(';')}};`;
  const models = Object.entries(schema.models)
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
                }${relationship.isDependent() ? 'Dependent' : 'Independent'}`,
                `readonly ${relationship.name}:${
                  relationship.type.endsWith('-to-many')
                    ? `RA<${relationship.relatedModel.name}>`
                    : `${relationship.relatedModel.name}${
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
  return `${index}${models}`;
}
