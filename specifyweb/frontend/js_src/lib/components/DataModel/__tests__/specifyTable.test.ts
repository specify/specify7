import { requireContext } from '../../../tests/helpers';
import { attachmentView } from '../../FormParse/webOnlyViews';
import { ResourceBase } from '../resourceApi';
import { LiteralField } from '../specifyField';
import { SpecifyTable } from '../specifyTable';
import { genericTables, tables } from '../tables';

requireContext();

test('literal fields are loaded', () =>
  expect(tables.CollectionObject.literalFields).toMatchSnapshot());

test('relationships are loaded', () =>
  expect(tables.CollectionObject.relationships).toMatchSnapshot());

test('fields are loaded', () =>
  expect(tables.CollectionObject.fields).toMatchSnapshot());

test('localization is loaded', () =>
  expect(tables.CollectionObject.localization).toMatchSnapshot());

test('localization is generated on the fly when empty', () =>
  expect(tables.DNASequencingRunAttachment.localization).toMatchSnapshot());

test('label is extracted from schema localization', () =>
  expect(tables.CollectionObject.label).toMatchInlineSnapshot(
    `"Collection Object"`
  ));

test('table name is generated on the fly if needed', () =>
  expect(tables.DNASequencingRunAttachment.label).toBe(
    'DNASequencing Run Attachment'
  ));

test('java name can be accessed', () =>
  expect(tables.CollectionObject.longName).toMatchInlineSnapshot(
    `"edu.ku.brc.specify.datamodel.CollectionObject"`
  ));

test('name can be accessed', () =>
  expect(tables.CollectionObject.name).toMatchInlineSnapshot(
    `"CollectionObject"`
  ));

test('view name is extracted from data table', () =>
  expect(tables.CollectionObject.view).toMatchInlineSnapshot(
    `"CollectionObject"`
  ));

test('view name is added on the front-end if missing', () =>
  expect(tables.SpQuery.view).toBe('Query'));

test('view name is overwritten for attachments', () =>
  expect(tables.Attachment.view).toBe(attachmentView));

test('table name is used as view name if missing', () =>
  expect(tables.AccessionAuthorization.view).toBe(
    tables.AccessionAuthorization.name
  ));

test('search dialog name is extracted', () =>
  expect(tables.CollectionObject.searchDialog).toMatchInlineSnapshot(
    `"CollectionObjectSearch"`
  ));

test('table id is extracted', () =>
  expect(tables.CollectionObject.tableId).toMatchInlineSnapshot(`1`));

test('isSystem flag is set to false for non-system tables', () =>
  expect(tables.CollectionObject.isSystem).toBe(false));

test('isSystem flag is set to true for system tables', () =>
  expect(tables.SpQuery.isSystem).toBe(true));

test('isHidden flag is set from localization', () =>
  expect(tables.CollectingEvent.isHidden).toBe(false));

test('field aliases are loaded when present', () =>
  expect(tables.Geography.fieldAliases).toEqual({
    acceptedparent: 'acceptedGeography',
    divisioncbx: 'division',
  }));

test('can create a resource from table', () => {
  const resource = new tables.CollectionObject.Resource();
  expect(resource).toBeInstanceOf(ResourceBase);
  expect(resource.specifyTable).toBe(tables.CollectionObject);
});

test('id field is created', () => {
  const idField = tables.CollectionObject.idField;
  expect(idField).toBeInstanceOf(LiteralField);
  expect(idField.isRequired).toBe(false);
  expect(idField.isHidden).toBe(true);
  expect(idField.isReadOnly).toBe(true);
  expect(idField.label).toBe('ID');
  expect(idField.type).toBe('java.lang.Integer');
  expect(idField.databaseColumn).toBe('collectionObjectId');
  expect(idField.name).toBe('collectionObjectId');
});

describe('Overrides', () => {
  describe('isCommon', () => {
    test('common base tables have isCommon set to true', () =>
      expect(tables.Accession.overrides.isCommon).toBe(true));

    test('non-common base tables have isCommon set to false', () =>
      expect(tables.AccessionAttachment.overrides.isCommon).toBe(false));
  });

  describe('isSystem', () => {
    test('non-system tables have isSystem override as false', () =>
      expect(tables.CollectionObject.overrides.isSystem).toBe(false));

    test('system tables have isSystem override as true', () =>
      expect(tables.SpQuery.overrides.isSystem).toBe(true));

    test('front-end override can make a table system', () => {
      expect(tables.CollectingEventAttr.isSystem).toBe(false);
      expect(tables.CollectingEventAttr.overrides.isSystem).toBe(true);
    });
  });

  describe('isHidden', () => {
    test('non-hidden tables have isHidden override as false', () =>
      expect(tables.CollectingEvent.overrides.isHidden).toBe(false));

    test('hidden tables have isHidden override as true', () => {
      expect(tables.AgentVariant.isHidden).toBe(true);
      expect(tables.AgentVariant.overrides.isHidden).toBe(true);
    });

    test('front-end override can hide a table', () => {
      expect(tables.SpSymbiotaInstance.isHidden).toBe(false);
      expect(tables.SpSymbiotaInstance.overrides.isHidden).toBe(true);
    });
  });
});

describe('getField', () => {
  test('get direct field', () =>
    expect(tables.CollectionObject.getField('date1')?.name).toBe('date1'));
  test('get indirect field', () =>
    expect(tables.CollectionObject.getField('accession.remarks')?.name).toBe(
      'remarks'
    ));
});

const serialized = (serializable: unknown): unknown =>
  JSON.parse(JSON.stringify(serializable));

describe('getFields', () => {
  test('get direct literal field', () =>
    expect(serialized(tables.CollectionObject.getFields('date1'))).toEqual([
      '[literalField CollectionObject.date1]',
    ]));
  test('get direct relationship', () =>
    expect(serialized(tables.CollectionObject.getFields('accession'))).toEqual([
      '[relationship CollectionObject.accession]',
    ]));
  test('get indirect field', () =>
    expect(
      serialized(tables.CollectionObject.getFields('accession.remarks'))
    ).toEqual([
      '[relationship CollectionObject.accession]',
      '[literalField Accession.remarks]',
    ]));
  test('get id field', () =>
    expect(
      serialized(tables.CollectionObject.getFields('collectionObjectId'))
    ).toEqual(['[literalField CollectionObject.collectionObjectId]']));
  test('get id field using alias', () =>
    expect(serialized(tables.CollectionObject.getFields('id'))).toEqual([
      '[literalField CollectionObject.collectionObjectId]',
    ]));
  test('get unknown field', () =>
    expect(tables.CollectionObject.getFields('_a')).toBeUndefined());
  test('handles empty field name case', () =>
    expect(tables.CollectionObject.getFields('')).toBeUndefined());
  test('throw on invalid field name', () =>
    expect(() =>
      tables.CollectionObject.getFields(false as unknown as string)
    ).toThrow('Invalid field name'));
  test('can get a field using schema alias', () =>
    expect(serialized(tables.Geography.getFields('acceptedParent'))).toEqual([
      '[relationship Geography.acceptedGeography]',
    ]));
  test('can get a field using schemaExtras alias', () =>
    expect(serialized(tables.PickList.getFields('fieldsCBX'))).toEqual([
      '[literalField PickList.fieldName]',
    ]));
  test('can get a field using global schemaExtras alias', () =>
    expect(serialized(tables.Accession.getFields('divisionCBX'))).toEqual([
      '[relationship Accession.division]',
    ]));
  test('can get a field even if mistakenly provided table name', () =>
    expect(
      serialized(tables.Locality.getFields('locality.localityName'))
    ).toEqual(['[literalField Locality.localityName]']));
  test('undefined when trying to use dot notation on a literal field', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(tables.CollectionObject.getFields('date1.date1')).toBeUndefined();
  });
});

describe('strictGetField', () => {
  test('can get a field', () =>
    expect(
      tables.CollectionObject.strictGetField('accession.remarks')?.name
    ).toBe('remarks'));
  test('throw if field is not found', () =>
    expect(() =>
      tables.CollectionObject.strictGetField('accessions.remarks')
    ).toThrow('Tried to get unknown field'));
});

describe('getLiteralField', () => {
  test('can get a literal field', () =>
    expect(
      tables.CollectionObject.getLiteralField('accession.remarks')?.name
    ).toBe('remarks'));
  test('throw if field is a relationship', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(() => tables.CollectionObject.getLiteralField('accession')).toThrow(
      'is a relationship'
    );
  });
});

describe('strictGetLiteralField', () => {
  test('can get a literal field', () =>
    expect(
      tables.CollectionObject.strictGetLiteralField('accession.remarks')?.name
    ).toBe('remarks'));
  test('throw if field is not found', () =>
    expect(() => tables.CollectionObject.strictGetLiteralField('abc')).toThrow(
      'Tried to get unknown literal field'
    ));
});

describe('getRelationship', () => {
  test('can get a relationship field', () =>
    expect(
      tables.CollectionObject.getRelationship('accession.division')?.name
    ).toBe('division'));
  test('throw if field is not a relationship', () =>
    expect(() =>
      tables.CollectionObject.getRelationship('accession.remarks')
    ).toThrow('is not a relationship'));
});

describe('strictGetRelationship', () => {
  test('can get a relationship field', () =>
    expect(
      tables.CollectionObject.strictGetRelationship('accession.division')?.name
    ).toBe('division'));
  test('throw if field is not found', () => {
    jest.spyOn(console, 'error').mockImplementation();
    expect(() =>
      tables.CollectionObject.strictGetRelationship('accessions')
    ).toThrow('Tried to get unknown relationship field');
  });
});

describe('getFormat', () => {
  test('can get formatter name if defined', () =>
    expect(tables.CollectionObject.getFormat()).toBe('CollectionObject'));
  test('returns undefined if formatter is not set', () =>
    expect(tables.AccessionAgent.getFormat()).toBeUndefined());
});

describe('getAggregator', () => {
  test('can get aggregator name if defined', () =>
    expect(tables.CollectionObject.getAggregator()).toBe('CollectionObject'));
  test('returns undefined if aggregator is not set', () =>
    expect(tables.Geography.getAggregator()).toBeUndefined());
});

describe('getScopingRelationship', () => {
  test('can get scoping relationship when scoped to Collection Object', () =>
    expect(tables.Determination.getScopingRelationship()?.name).toBe(
      'collectionObject'
    ));
  test('can get scoping relationship when scoped to Collection', () =>
    expect(tables.CollectionObject.getScopingRelationship()?.name).toBe(
      'collection'
    ));
  test('can get scoping relationship when scoped to Discipline', () =>
    expect(tables.CollectingEvent.getScopingRelationship()?.name).toBe(
      'discipline'
    ));
  test('can get scoping relationship when scoped to Division', () =>
    expect(tables.Discipline.getScopingRelationship()?.name).toBe('division'));
  test('can get scoping relationship when scoped to Institution', () =>
    expect(tables.Division.getScopingRelationship()?.name).toBe('institution'));
  test('returns undefined if table is not scoped', () =>
    expect(tables.SpecifyUser.getScopingRelationship()).toBeUndefined());
});

describe('getScopingPath', () => {
  test('can get scoping path when scoped to Collection Object', () =>
    expect(tables.Determination.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
      'collection',
      'collectionobject',
    ]));
  test('can get scoping path when scoped to Collection', () =>
    expect(tables.CollectionObject.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
      'collection',
    ]));
  test('can get scoping path when scoped to Discipline', () =>
    expect(tables.CollectingEvent.getScopingPath()).toEqual([
      'institution',
      'division',
      'discipline',
    ]));
  test('can get scoping path when scoped to Division', () =>
    expect(tables.Discipline.getScopingPath()).toEqual([
      'institution',
      'division',
    ]));
  test('can get scoping path when scoped to Institution', () =>
    expect(tables.Division.getScopingPath()).toEqual(['institution']));
  test('returns undefined if table is not scoped', () =>
    expect(tables.SpecifyUser.getScopingPath()).toBeUndefined());
});

test('toJSON', () =>
  expect(tables.CollectionObject.toJSON()).toBe('[table CollectionObject]'));

describe('fromJson', () => {
  test('CollectionObject', () =>
    expect(SpecifyTable.fromJson('[table CollectionObject]')).toBe(
      tables.CollectionObject
    ));
  test('Accession', () =>
    expect(SpecifyTable.fromJson('[table Accession]')).toBe(tables.Accession));
  test('Table name typo', () =>
    expect(SpecifyTable.fromJson('[table Accessions]')).toBeUndefined());
  test('Invalid type', () =>
    expect(SpecifyTable.fromJson('[relationship Accessions]')).toBeUndefined());
  test('Incorrect formatting', () =>
    expect(SpecifyTable.fromJson('table Accessions')).toBeUndefined());
  test('Empty container', () =>
    expect(SpecifyTable.fromJson('[]')).toBeUndefined());
});

test('tableScoping', () =>
  expect(
    Object.fromEntries(
      Object.entries(genericTables).map(([name, table]) => [
        name,
        table
          .getScope()
          ?.map(({ name }) => name)
          .join(' > '),
      ])
    )
  ).toMatchSnapshot());

test('indexed fields are loaded', () =>
  expect(tables.CollectionObject.field).toMatchSnapshot());
