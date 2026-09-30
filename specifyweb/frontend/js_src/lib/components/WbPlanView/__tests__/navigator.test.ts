import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { localized } from '../../../utils/types';
import { getMappingLineData, searchFields } from '../navigator';
import { navigatorSpecs } from '../navigatorSpecs';

requireContext();

test('searchFields returns matching downstream fields in join order', () => {
  const results = searchFields({
    baseTableName: 'CollectionObject',
    search: 'taxon',
    spec: navigatorSpecs.wbPlanView,
  });
  expect(results.length).toBeGreaterThan(0);
  expect(results.every(({ mappingPath }) => mappingPath.at(-1))).toBe(true);
  const joinCounts = results.map(({ joinCount }) => joinCount);
  expect(joinCounts).toEqual([...joinCounts].sort((a, b) => a - b));
});

test('searchFields matches relationship names and returns complete paths', () => {
  const results = searchFields({
    baseTableName: 'CollectionObject',
    search: 'determination',
    spec: navigatorSpecs.wbPlanView,
  });

  expect(results).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: expect.arrayContaining(['determinations']),
      }),
    ])
  );
});

test('searchFields includes aggregate and formatted relationship options', () => {
  const aggregateResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'determinations',
    spec: navigatorSpecs.wbPlanView,
  });
  const formattedResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'cataloger',
    spec: navigatorSpecs.wbPlanView,
  });

  expect(aggregateResults).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: ['determinations', '#1', '-formatted'],
      }),
    ])
  );
  expect(formattedResults).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: ['cataloger', '-formatted'],
      }),
    ])
  );
});

test('searchFields resolves tree ranks and rank fields', () => {
  const speciesResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'Species',
    spec: navigatorSpecs.wbPlanView,
  });
  const fullNameResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'Full Name',
    spec: navigatorSpecs.queryBuilder,
  });

  expect(speciesResults).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: ['determinations', '#1', 'taxon', '$Species', 'fullName'],
        label: expect.stringMatching(/Species$/u),
      }),
    ])
  );
  expect(speciesResults).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: ['determinations', '#1', 'taxon', '$Species', 'name'],
      }),
    ])
  );
  expect(fullNameResults).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        mappingPath: expect.arrayContaining(['$Species', 'fullName']),
      }),
    ])
  );
});

test('searchFields prefers the collecting event route to collectors', () => {
  const results = searchFields({
    baseTableName: 'CollectionObject',
    search: 'collectors',
    spec: navigatorSpecs.wbPlanView,
  });
  const normalizedPath = (mappingPath: readonly string[]): string[] =>
    mappingPath.filter(
      (part) => !part.startsWith('#') && part !== '-formatted'
    );
  const preferredIndex = results.findIndex(
    ({ mappingPath }) =>
      normalizedPath(mappingPath).slice(0, 2).join('.') ===
      'collectingEvent.collectors'
  );
  const discouragedIndex = results.findIndex(
    ({ mappingPath }) =>
      normalizedPath(mappingPath).slice(0, 2).join('.') ===
      'cataloger.collectors'
  );

  expect(preferredIndex).toBeGreaterThanOrEqual(0);
  expect(discouragedIndex).toBeGreaterThanOrEqual(0);
  expect(preferredIndex).toBeLessThan(discouragedIndex);
});

test('searchFields returns no results for empty input', () => {
  expect(
    searchFields({
      baseTableName: 'CollectionObject',
      search: '  ',
      spec: navigatorSpecs.wbPlanView,
    })
  ).toEqual([]);
});

test('searchFields tolerates hidden-field searches across unconfigured trees', () => {
  expect(() =>
    searchFields({
      baseTableName: 'CollectionObject',
      search: 'modified',
      showHiddenFields: true,
      spec: navigatorSpecs.wbPlanView,
    })
  ).not.toThrow();
});

test('searchFields includes read-only fields only for Query Builder', () => {
  const workBenchResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'timestampModified',
    spec: navigatorSpecs.wbPlanView,
  });
  const queryBuilderResults = searchFields({
    baseTableName: 'CollectionObject',
    search: 'timestampModified',
    spec: navigatorSpecs.queryBuilder,
  });

  expect(
    workBenchResults.some(({ mappingPath }) =>
      mappingPath.includes('timestampModified')
    )
  ).toBe(false);
  expect(
    queryBuilderResults.some(({ mappingPath }) =>
      mappingPath.includes('timestampModified')
    )
  ).toBe(true);
});

// TEST: break this test into smaller tests
theories(getMappingLineData, [
  {
    in: [
      {
        baseTableName: 'CollectionObject',
        mappingPath: ['determinations', '#1', 'taxon', '$Family', 'name'],
        showHiddenFields: false,
        generateFieldData: 'all',
        spec: navigatorSpecs.wbPlanView,
      },
    ],
    out: [
      {
        customSelectSubtype: 'simple',
        defaultValue: 'determinations',
        selectLabel: localized('Collection Object'),
        fieldsData: {
          catalogNumber: {
            optionLabel: 'Cat #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          absoluteAges: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Absolute Ages',
            tableName: 'AbsoluteAge',
          },
          relativeAges: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Relative Ages',
            tableName: 'RelativeAge',
          },
          catalogedDate: {
            optionLabel: 'Cat Date',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          reservedText: {
            optionLabel: 'CT Scan',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          altCatalogNumber: {
            optionLabel: 'Prev/Exch #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          projectNumber: {
            optionLabel: 'Project Number',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          remarks: {
            optionLabel: 'Remarks',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          reservedText2: {
            optionLabel: 'Reserved Text2',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          fieldNumber: {
            optionLabel: 'Voucher',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          accession: {
            optionLabel: 'Accession #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Accession',
          },
          cataloger: {
            optionLabel: 'Cataloger',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Agent',
          },
          cojo: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Cojo',
            tableName: 'CollectionObjectGroupJoin',
          },
          collectionObjectAttribute: {
            optionLabel: 'Col Obj Attribute',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectAttribute',
          },
          collection: {
            optionLabel: 'Collection',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Collection',
          },
          collectionObjectAttachments: {
            optionLabel: 'Collection Object Attachments',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectAttachment',
          },
          collectionObjectCitations: {
            optionLabel: 'Collection Object Citations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectCitation',
          },
          collectionObjectType: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Collection Object Type',
            tableName: 'CollectionObjectType',
          },
          components: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Components',
            tableName: 'Component',
          },
          determinations: {
            optionLabel: 'Determinations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: true,
            isRelationship: true,
            tableName: 'Determination',
          },
          dnaSequences: {
            optionLabel: 'DNA Sequences',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'DNASequence',
          },
          collectingEvent: {
            optionLabel: 'Field No: Locality',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectingEvent',
          },
          leftSideRels: {
            optionLabel: 'Left Side Rels',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionRelationship',
          },
          preparations: {
            optionLabel: 'Preparations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Preparation',
          },
          rightSideRels: {
            optionLabel: 'Right Side Rels',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionRelationship',
          },
          voucherRelationships: {
            optionLabel: 'Voucher Relationships',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'VoucherRelationship',
          },
        },
        tableName: 'CollectionObject',
      },
      {
        customSelectSubtype: 'toMany',
        defaultValue: '#1',
        selectLabel: localized('Determination'),
        fieldsData: {
          '#1': {
            optionLabel: '#1',
            isRelationship: true,
            isDefault: true,
            tableName: 'Determination',
          },
          '#2': {
            optionLabel: 'Add',
            isRelationship: true,
            isDefault: false,
            tableName: 'Determination',
          },
        },
        tableName: 'Determination',
      },
      {
        customSelectSubtype: 'simple',
        defaultValue: 'taxon',
        selectLabel: localized('Determination'),
        fieldsData: {
          determinedDate: {
            optionLabel: 'Date',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          typeStatusName: {
            optionLabel: 'Type Status',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          determiner: {
            optionLabel: 'Determiner',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Agent',
          },
          determiners: {
            optionLabel: 'Determiners',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Determiner',
          },
          taxon: {
            optionLabel: 'Taxon',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: true,
            isRelationship: true,
            tableName: 'Taxon',
          },
        },
        tableName: 'Determination',
      },
      {
        customSelectSubtype: 'tree',
        defaultValue: '$Family',
        selectLabel: localized('Taxon'),
        fieldsData: {
          $Kingdom: {
            optionLabel: 'Kingdom',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Phylum: {
            optionLabel: 'Phylum',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Class: {
            optionLabel: 'Class',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Order: {
            optionLabel: 'Order',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Family: {
            optionLabel: 'Family',
            isRelationship: true,
            isDefault: true,
            tableName: 'Taxon',
          },
          $Subfamily: {
            optionLabel: 'Subfamily',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Genus: {
            optionLabel: 'Genus',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Subgenus: {
            optionLabel: 'Subgenus',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Species: {
            optionLabel: 'Species',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Subspecies: {
            optionLabel: 'Subspecies',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
        },
        tableName: 'Taxon',
      },
      {
        customSelectSubtype: 'simple',
        defaultValue: 'name',
        selectLabel: localized('Taxon'),
        fieldsData: {
          author: {
            optionLabel: 'Author',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          commonName: {
            optionLabel: 'Common Name',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          name: {
            optionLabel: 'Name',
            isEnabled: true,
            isRequired: true,
            isHidden: false,
            isDefault: true,
            isRelationship: false,
          },
          remarks: {
            optionLabel: 'Remarks',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          source: {
            optionLabel: 'Source',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
        },
        tableName: 'Taxon',
      },
    ],
  },
  {
    in: [
      {
        baseTableName: 'CollectionObject',
        mappingPath: ['determinations', '#1', 'taxon', '$Family', 'name'],
        showHiddenFields: false,
        generateFieldData: 'all',
        spec: navigatorSpecs.queryBuilder,
      },
    ],
    out: [
      {
        customSelectSubtype: 'simple',
        defaultValue: 'determinations',
        selectLabel: localized('Collection Object'),
        fieldsData: {
          '-formatted': {
            optionLabel: '(formatted)',
            tableName: 'CollectionObject',
            isRelationship: false,
            isDefault: false,
            isEnabled: true,
          },
          absoluteAges: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Absolute Ages',
            tableName: 'AbsoluteAge',
          },
          catalogNumber: {
            optionLabel: 'Cat #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'catalogedDate-fullDate': {
            optionLabel: 'Cat Date',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'catalogedDate-day': {
            optionLabel: 'Cat Date (Day)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'catalogedDate-month': {
            optionLabel: 'Cat Date (Month)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'catalogedDate-year': {
            optionLabel: 'Cat Date (Year)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          reservedText: {
            optionLabel: 'CT Scan',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'timestampModified-fullDate': {
            optionLabel: 'Date Edited',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'timestampModified-day': {
            optionLabel: 'Date Edited (Day)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'timestampModified-month': {
            optionLabel: 'Date Edited (Month)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'timestampModified-year': {
            optionLabel: 'Date Edited (Year)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          altCatalogNumber: {
            optionLabel: 'Prev/Exch #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          projectNumber: {
            optionLabel: 'Project Number',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          remarks: {
            optionLabel: 'Remarks',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          reservedText2: {
            optionLabel: 'Reserved Text2',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          fieldNumber: {
            optionLabel: 'Voucher',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          accession: {
            optionLabel: 'Accession #',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Accession',
          },
          cojo: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Cojo',
            tableName: 'CollectionObjectGroupJoin',
          },
          cataloger: {
            optionLabel: 'Cataloger',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Agent',
          },
          collectionObjectAttribute: {
            optionLabel: 'Col Obj Attribute',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectAttribute',
          },
          collection: {
            optionLabel: 'Collection',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Collection',
          },
          collectionObjectAttachments: {
            optionLabel: 'Collection Object Attachments',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectAttachment',
          },
          collectionObjectCitations: {
            optionLabel: 'Collection Object Citations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionObjectCitation',
          },
          collectionObjectType: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Collection Object Type',
            tableName: 'CollectionObjectType',
          },
          components: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Components',
            tableName: 'Component',
          },
          determinations: {
            optionLabel: 'Determinations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: true,
            isRelationship: true,
            tableName: 'Determination',
          },
          dnaSequences: {
            optionLabel: 'DNA Sequences',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'DNASequence',
          },
          modifiedByAgent: {
            optionLabel: 'Edited By',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Agent',
          },
          collectingEvent: {
            optionLabel: 'Field No: Locality',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectingEvent',
          },
          relativeAges: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: true,
            isRequired: false,
            optionLabel: 'Relative Ages',
            tableName: 'RelativeAge',
          },
          leftSideRels: {
            optionLabel: 'Left Side Rels',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionRelationship',
          },
          preparations: {
            optionLabel: 'Preparations',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Preparation',
          },
          rightSideRels: {
            optionLabel: 'Right Side Rels',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'CollectionRelationship',
          },
          voucherRelationships: {
            optionLabel: 'Voucher Relationships',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'VoucherRelationship',
          },
        },
        tableName: 'CollectionObject',
      },
      {
        customSelectSubtype: 'simple',
        defaultValue: 'taxon',
        selectLabel: localized('Determination'),
        fieldsData: {
          '-formatted': {
            optionLabel: '(aggregated)',
            tableName: 'Determination',
            isRelationship: false,
            isDefault: false,
            isEnabled: true,
          },
          isCurrent: {
            optionLabel: 'Current',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'determinedDate-fullDate': {
            optionLabel: 'Date',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'determinedDate-day': {
            optionLabel: 'Date (Day)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'determinedDate-month': {
            optionLabel: 'Date (Month)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          'determinedDate-year': {
            optionLabel: 'Date (Year)',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          typeStatusName: {
            optionLabel: 'Type Status',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          determiner: {
            optionLabel: 'Determiner',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Agent',
          },
          determiners: {
            optionLabel: 'Determiners',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Determiner',
          },
          preferredTaxon: {
            optionLabel: 'Preferred Taxon',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: true,
            tableName: 'Taxon',
          },
          taxon: {
            optionLabel: 'Taxon',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: true,
            isRelationship: true,
            tableName: 'Taxon',
          },
        },
        tableName: 'Determination',
      },
      {
        customSelectSubtype: 'tree',
        defaultValue: '$Family',
        selectLabel: localized('Taxon'),
        fieldsData: {
          '$-any': {
            optionLabel: '(any rank)',
            isRelationship: true,
            isDefault: false,
            isEnabled: true,
            tableName: 'Taxon',
          },
          $Kingdom: {
            optionLabel: 'Kingdom',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Phylum: {
            optionLabel: 'Phylum',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Class: {
            optionLabel: 'Class',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Order: {
            optionLabel: 'Order',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Family: {
            optionLabel: 'Family',
            isRelationship: true,
            isDefault: true,
            tableName: 'Taxon',
          },
          $Subfamily: {
            optionLabel: 'Subfamily',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Genus: {
            optionLabel: 'Genus',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Subgenus: {
            optionLabel: 'Subgenus',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Species: {
            optionLabel: 'Species',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
          $Subspecies: {
            optionLabel: 'Subspecies',
            isRelationship: true,
            isDefault: false,
            tableName: 'Taxon',
          },
        },
        tableName: 'Taxon',
      },
      {
        customSelectSubtype: 'simple',
        defaultValue: 'name',
        selectLabel: localized('Taxon'),
        fieldsData: {
          author: {
            optionLabel: 'Author',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          fullName: {
            optionLabel: 'Full Name',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          commonName: {
            optionLabel: 'Common Name',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          guid: {
            optionLabel: 'GUID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          isAccepted: {
            isDefault: false,
            isEnabled: true,
            isHidden: false,
            isRelationship: false,
            isRequired: false,
            optionLabel: 'Is Preferred',
          },
          isHybrid: {
            optionLabel: 'Is Hybrid',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          name: {
            optionLabel: 'Name',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: true,
            isRelationship: false,
          },
          rankId: {
            optionLabel: 'Rank ID',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          remarks: {
            optionLabel: 'Remarks',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
          source: {
            optionLabel: 'Source',
            isEnabled: true,
            isRequired: false,
            isHidden: false,
            isDefault: false,
            isRelationship: false,
          },
        },
        tableName: 'Taxon',
      },
    ],
  },
]);
