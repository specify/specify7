/* The dataModel types types were generated using this code snippet: */
/* eslint-disable multiline-comment-style*/
/* ;
import schema from './schema';

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

function regenerate() {
  const index = `export type Tables = {${Object.keys(schema.models).map(
    (tableName) => `readonly ${tableName}: ${tableName}`
  )}};`;
  const models = Object.entries(schema.models)
    .map(([tableName, { fields }]) => {
      const groups = fields.reduce(
        (
          model,
          {
            isRequired,
            isRelationship,
            dependent,
            relatedModelName,
            type,
            name,
          }
        ) => {
          const field = `readonly ${name}:${
            isRelationship
              ? `${type.endsWith('-to-many') ? 'RA<' : ''}${relatedModelName}${
                  type.endsWith('-to-many') ? '>' : ''
                }`
              : javaTypeToTypeScript[type]
          }${
            (isRelationship && type.endsWith('-to-many')) || isRequired
              ? ''
              : '|null'
          };`;
          model[
            isRelationship
              ? `${type.endsWith('-to-many') ? 'toMany' : 'toOne'}${
                  dependent ? 'Dependent' : 'Independent'
                }`
              : 'fields'
          ] += field;
          return model;
        },
        {
          fields: '',
          toOneDependent: '',
          toOneIndependent: '',
          toManyDependent: '',
          toManyIndependent: '',
        }
      );
      return `export type ${tableName} = TableSchema & {${Object.entries(groups)
        .map(
          ([group, fields]) =>
            `readonly ${group}: ${
              fields.length === 0 ? 'IR<never>' : `{${fields}}`
            }`
        )
        .join(';')}}`;
    })
    .join(';');
  return `${index}${models}`;
}

*/
/* eslint-enable multiline-comment-style*/
