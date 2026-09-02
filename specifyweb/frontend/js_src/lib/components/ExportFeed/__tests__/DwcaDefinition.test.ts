import {
  parseQueryFields,
  unParseQueryFields,
} from '../../QueryBuilder/helpers';
import { requireContext } from '../../../tests/helpers';
import {
  getMappingTerm,
  getSerializedMappingTerm,
  ensureIdentifierTerm,
  parseDefinition,
  serializeDefinition,
} from '../DwcaDefinition';

const occurrenceId = 'http://rs.tdwg.org/dwc/terms/occurrenceID';
const kingdom = 'http://rs.tdwg.org/dwc/terms/kingdom';

requireContext();

describe('DwCA query field term mapping', () => {
  test('adds the GUID occurrenceID field to empty mappings', () => {
    const [core, extension] = parseDefinition(`
      <archive>
        <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
          <queries><query name="core.csv" contextTableId="1" /></queries>
        </core>
        <extension rowType="http://rs.gbif.org/terms/1.0/Multimedia">
          <queries><query name="Multimedia.csv" contextTableId="1" /></queries>
        </extension>
      </archive>
    `);

    for (const mapping of [core, extension]) {
      expect(mapping?.fields[0]?.stringId).toBe('1.collectionobject.guid');
      expect(mapping?.terms[0]).toBe(occurrenceId);
    }
  });

  test('uses the serialized field index rather than the rendered line id', () => {
    const mapping = {
      extension: false,
      fields: [
        { stringId: '1.collectionobject.guid' },
        { stringId: 'taxon.Kingdom' },
      ],
      terms: [occurrenceId, kingdom],
    } as const;

    expect(
      getMappingTerm(mapping, {
        id: 0,
        sourceIndex: 1,
        sourceStringId: 'taxon.Kingdom',
      })
    ).toBe(kingdom);
  });

  test('keeps custom terms verbatim', () => {
    const custom = 'https://example.org/terms/myCustomTerm';
    expect(
      getMappingTerm(
        { extension: true, fields: [{ stringId: 'custom' }], terms: [custom] },
        { id: 0, sourceIndex: 0 }
      )
    ).toBe(custom);
  });

  test('serializes terms by field identity after query fields are reordered', () => {
    const custom = 'https://example.org/terms/myCustomTerm';
    const mapping = {
      fields: [
        { stringId: '1.collectionobject.guid' },
        { stringId: '1,9-determinations,4-preferredTaxon.taxon.Kingdom' },
      ],
      terms: [occurrenceId, custom],
    } as const;

    expect(
      getSerializedMappingTerm(
        mapping,
        { stringId: '1,9-determinations,4-preferredTaxon.taxon.Kingdom' },
        0
      )
    ).toBe(custom);
  });

  test('loads relationship fields with their XML terms into the mapper model', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <id stringId="1.collectionobject.guid" term="${occurrenceId}" />
      <field stringId="1,9-determinations,4-preferredTaxon.taxon.Kingdom" />
      <field stringId="1,9-determinations,4-preferredTaxon.taxon.Phylum" />
      <field stringId="1,9-determinations,4-preferredTaxon.taxon.Class" />
    </query></queries><id index="0" /></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const queryFields = parseQueryFields(mapping.fields);
    expect(queryFields.map((field) => getMappingTerm(mapping, field))).toEqual([
      occurrenceId,
      kingdom,
      'http://rs.tdwg.org/dwc/terms/phylum',
      'http://rs.tdwg.org/dwc/terms/class',
    ]);
  });

  test('keeps a displayed relationship field displayed through QueryBuilder conversion', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <id stringId="1.collectionobject.guid" term="${occurrenceId}" />
      <field stringId="1,63-preparations.preparation.preparations" isRelFld="true" term="http://rs.tdwg.org/dwc/terms/preparations" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const converted = unParseQueryFields(
      'CollectionObject',
      parseQueryFields(mapping.fields)
    );
    const preparation = converted.find(({ stringId }) =>
      stringId.includes('preparations')
    );
    expect(preparation?.isDisplay).toBe(true);
    expect(getSerializedMappingTerm(mapping, preparation!, 1)).toBe(
      'http://rs.tdwg.org/dwc/terms/preparations'
    );
  });

  test('does not drop a relationship term when QueryBuilder marks the field hidden', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <id stringId="1.collectionobject.guid" term="${occurrenceId}" />
      <field stringId="1,63-preparations.preparation.preparations" isRelFld="true" term="http://rs.tdwg.org/dwc/terms/preparations" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');
    const hiddenMapping = {
      ...mapping,
      fields: mapping.fields.map((field, index) =>
        index === 1 ? { ...field, isDisplay: false } : field
      ),
    };

    expect(serializeDefinition([hiddenMapping])).toContain(
      'term="http://rs.tdwg.org/dwc/terms/preparations"'
    );
  });

  test('preserves terms when QueryBuilder canonicalizes raw XML field identities', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="occurrence.csv" contextTableId="1">
      <id stringId="1.collectionobject.guid" term="${occurrenceId}" oper="8" value="" isNot="false" isRelFld="false" />
      <field stringId="1,9-determinations,4.taxon.Kingdom" term="${kingdom}" oper="8" value="" isNot="false" isRelFld="false" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const roundTrippedFields = unParseQueryFields(
      'CollectionObject',
      parseQueryFields(mapping.fields)
    );
    const [roundTrippedField] = roundTrippedFields.slice(1);
    expect(
      getMappingTerm(mapping, {
        id: 0,
        sourceIndex: 1,
        sourceStringId:
          roundTrippedField?.stringId ??
          '1,9-determinations,4-preferredTaxon.taxon.Kingdom',
      })
    ).toBe(kingdom);
  });

  test('puts an existing collection object GUID first and maps it to occurrenceID', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <field stringId="1.collectionobject.catalogNumber" term="http://rs.tdwg.org/dwc/terms/catalogNumber" />
      <field stringId="1.collectionobject.guid" term="${occurrenceId}" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const updated = ensureIdentifierTerm(mapping);
    expect(updated.fields[0]?.stringId).toBe('1.collectionobject.guid');
    expect(updated.terms[0]).toBe(occurrenceId);
  });

  test('inserts a collection object GUID when a seed query does not contain one', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <field stringId="1.collectionobject.catalogNumber" term="http://rs.tdwg.org/dwc/terms/catalogNumber" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const updated = ensureIdentifierTerm(mapping);
    expect(updated.fields[0]?.stringId).toBe('1.collectionobject.guid');
    expect(updated.terms[0]).toBe(occurrenceId);
  });

  test('normalizes the core identifier to the displayed collection object GUID', () => {
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <field stringId="guid" isDisplay="false" />
    </query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    const updated = ensureIdentifierTerm(mapping);
    expect(updated.fields[0]).toMatchObject({
      stringId: '1.collectionobject.guid',
      isDisplay: true,
    });
    expect(updated.terms[0]).toBe(occurrenceId);
  });

  test('automatically maps the expanded core default field patterns', () => {
    const fields = [
      ['1.collectionobject.guid', occurrenceId],
      [
        '1,23,26,96,94.institution.altName',
        'http://rs.tdwg.org/dwc/terms/institutionID',
      ],
      [
        '1,23,26,96,94.institution.copyright',
        'http://purl.org/dc/terms/license',
      ],
      [
        '1,23,26,96,94.institution.termsOfUse',
        'http://purl.org/dc/terms/accessRights',
      ],
      [
        '1,23.collection.collectionType',
        'http://rs.tdwg.org/dwc/terms/basisOfRecord',
      ],
      [
        '1,23.collection.description',
        'http://rs.tdwg.org/dwc/terms/datasetName',
      ],
      ['1,23.collection.guid', 'http://rs.tdwg.org/dwc/terms/datasetID'],
      [
        '1.collectionobject.altCatalogNumber',
        'http://rs.tdwg.org/dwc/terms/otherCatalogNumbers',
      ],
      [
        '1.collectionobject.timestampModified',
        'http://purl.org/dc/terms/modified',
      ],
      [
        '1,9-determinations,4.taxon.Species Author',
        'http://rs.tdwg.org/dwc/terms/scientificNameAuthorship',
      ],
      [
        '1,9-determinations,5-determiner.agent.determiner',
        'http://rs.tdwg.org/dwc/terms/identifiedBy',
      ],
      [
        '1,9-determinations.determination.typeStatusName',
        'http://rs.tdwg.org/dwc/terms/typeStatus',
      ],
      [
        '1,10.collectingevent.startDateNumericDay',
        'http://rs.tdwg.org/dwc/terms/day',
      ],
      [
        '1,10.collectingevent.startDateNumericMonth',
        'http://rs.tdwg.org/dwc/terms/month',
      ],
      [
        '1,10.collectingevent.startDateNumericYear',
        'http://rs.tdwg.org/dwc/terms/year',
      ],
      [
        '1,10,92.collectingeventattribute.number13',
        'http://rs.tdwg.org/dwc/terms/minimumDepthInMeters',
      ],
      [
        '1,10,92.collectingeventattribute.number12',
        'http://rs.tdwg.org/dwc/terms/maximumDepthInMeters',
      ],
      ['1,10,2.locality.localityName', 'http://rs.tdwg.org/dwc/terms/locality'],
      [
        '1,10,2.locality.latLongMethod',
        'http://rs.tdwg.org/dwc/terms/georeferenceSources',
      ],
      [
        '1,10,2,123-geoCoordDetails.geocoorddetail.geoRefRemarks',
        'http://rs.tdwg.org/dwc/terms/georeferenceRemarks',
      ],
      [
        '1,10,2,123-geoCoordDetails.geocoorddetail.geoRefDetDate',
        'http://rs.tdwg.org/dwc/terms/georeferencedDate',
      ],
      [
        '1,10,2,123-geoCoordDetails,5-geoRefDetBy.agent.geoRefDetBy',
        'http://rs.tdwg.org/dwc/terms/georeferencedBy',
      ],
      [
        '1,10,2,3.geography.geography',
        'http://rs.tdwg.org/dwc/terms/higherGeography',
      ],
      ['1,10,2.locality.elevationMethod', 'http://rs.tdwg.org/dwc/iri/habitat'],
    ] as const;
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">${fields
      .map(([stringId]) => `<field stringId="${stringId}" />`)
      .join('')}</query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    expect(mapping.terms).toEqual(fields.map(([, term]) => term));
  });
});
