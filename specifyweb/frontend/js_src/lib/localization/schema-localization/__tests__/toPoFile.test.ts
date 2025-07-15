import { theories } from '../../../tests/utils';
import { schemaLocalizationFile } from '../gatherLocalization';
import {
  componentNameToSchemaPath,
  exportsForTests,
  schemaLocalizationName,
} from '../toPoFile';

const { schemaPathToComponentName, mainSchemaName, locationToString } =
  exportsForTests;

const cases = {
  [`${schemaLocalizationName}${mainSchemaName}`]: schemaLocalizationFile,
  [`${schemaLocalizationName}bio`]: `bio/${schemaLocalizationFile}`,
  [`${schemaLocalizationName}bio-bas`]: `bio/bas/${schemaLocalizationFile}`,
};

describe('Can convert path to component name and back', () =>
  void Object.entries(cases).forEach(([name, path]) =>
    test(`${path} <--> ${name}`, () => {
      expect(schemaPathToComponentName(path)).toBe(name);
      expect(componentNameToSchemaPath(name)).toBe(path);
    })
  ));

theories(locationToString, [
  {
    in: [
      {
        tableName: 'collectionobject',
        fieldName: 'catalogNumber',
        type: 'name',
      },
    ],
    out: 'Collectionobject - CatalogNumber [Name]',
  },
  {
    in: [
      {
        tableName: 'collectionobject',
        fieldName: undefined,
        type: 'description',
      },
    ],
    out: 'Collectionobject  [Description]',
  },
]);
