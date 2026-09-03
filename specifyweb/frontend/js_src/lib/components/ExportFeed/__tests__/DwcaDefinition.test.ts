import {
  parseQueryFields,
  unParseQueryFields,
} from '../../QueryBuilder/helpers';
import { requireContext } from '../../../tests/helpers';
import {
  getMappingTerm,
  getMappingTabValue,
  getMappingTabValues,
  getSerializedMappingTerm,
  ensureIdentifierTerm,
  defaultRowTypes,
  getExtensionDefinitionForRowType,
  getTermDisplayLabel,
  getTemplateMapping,
  parseDefinition,
  serializeDefinition,
  updateMappingTerm,
  updateMappingFields,
} from '../DwcaDefinition';
import { defaultTemplates } from '../data/defaultTemplates';

const occurrenceId = 'http://rs.tdwg.org/dwc/terms/occurrenceID';
const kingdom = 'http://rs.tdwg.org/dwc/terms/kingdom';

requireContext();

describe('DwCA query field term mapping', () => {
  test('uses the core or row type as the mapping URL value', () => {
    expect(
      getMappingTabValue({ extension: false, rowType: 'occurrence' })
    ).toBe('core');
    expect(
      getMappingTabValue({
        extension: true,
        rowType: 'http://rs.tdwg.org/dwc/terms/Identification',
      })
    ).toBe('identification');
  });

  test('disambiguates duplicate extension tab names', () => {
    expect(
      getMappingTabValues([
        {
          extension: true,
          rowType: 'http://example.org/Multimedia',
        },
        {
          extension: true,
          rowType: 'http://example.org/Multimedia',
        },
      ])
    ).toEqual(['multimedia', 'multimedia-2']);
  });

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

  test('does not fall back to another term when the matching field is unmapped', () => {
    const mapping = {
      extension: true,
      fields: [
        { stringId: '1.collectionobject.guid' },
        { stringId: '1.collectionobject.catalogNumber' },
      ],
      terms: [occurrenceId, undefined],
    } as const;

    expect(
      getMappingTerm(mapping, {
        id: 0,
        sourceIndex: 1,
        sourceStringId: '1.collectionobject.catalogNumber',
      })
    ).toBe(undefined);
  });

  test('updates a term by field identity after fields move', () => {
    const [mapping] =
      parseDefinition(`<archive><extension rowType="custom"><queries><query name="custom.csv" contextTableId="1">
      <field stringId="1.collectionobject.guid" term="${occurrenceId}" />
      <field stringId="1.collectionobject.catalogNumber" />
    </query></queries></extension></archive>`);
    if (mapping === undefined) throw new Error('Mapping was not parsed');

    const moved = {
      ...mapping,
      fields: [mapping.fields[1]!, mapping.fields[0]!],
      terms: [undefined, occurrenceId],
    };
    expect(
      updateMappingTerm(
        moved,
        {
          sourceIndex: 0,
          sourceStringId: '1.collectionobject.guid',
        },
        kingdom
      ).terms
    ).toEqual([undefined, kingdom]);
  });

  test('automaps a newly inserted field instead of using its position', () => {
    const catalogNumber = 'http://rs.tdwg.org/dwc/terms/catalogNumber';
    const [mapping] =
      parseDefinition(`<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">
      <id stringId="1.collectionobject.guid" term="${occurrenceId}" />
      <field stringId="1.collectionobject.catalogNumber" term="${catalogNumber}" />
    </query></queries></core></archive>`);
    if (mapping === undefined) throw new Error('Mapping was not parsed');

    const [guid, catalog] = mapping.fields;
    const verbatimElevation = {
      ...catalog,
      stringId: '1,10,2.locality.verbatimelevation',
      position: 1,
    };
    const updated = updateMappingFields(mapping, [
      { ...guid!, position: 0 },
      verbatimElevation,
      { ...catalog!, position: 2 },
    ]);

    expect(updated.terms).toEqual([
      occurrenceId,
      'http://rs.tdwg.org/dwc/terms/verbatimElevation',
      catalogNumber,
    ]);
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

  test('provides all built-in row types as defaults', () => {
    expect(defaultRowTypes).toContain('http://rs.tdwg.org/ac/terms/Multimedia');
    expect(defaultRowTypes).toContain(
      'http://rs.tdwg.org/dwc/terms/MeasurementOrFact'
    );
  });

  test('resolves extension definitions from their row types', () => {
    expect(
      getExtensionDefinitionForRowType('http://rs.tdwg.org/ac/terms/Multimedia')
    ).toMatchObject({
      name: 'Multimedia',
      title: 'Audiovisual Media Description',
    });
    expect(
      getExtensionDefinitionForRowType('https://example.org/row-type')
    ).toBe(undefined);
  });

  test('disambiguates duplicate term titles in the term picker', () => {
    const terms = [
      {
        name: 'http://rs.tdwg.org/ac/terms/commenterLiteral',
        title: 'Commenter',
      },
      {
        name: 'http://rs.tdwg.org/ac/terms/commenter',
        title: 'Commenter',
      },
    ] as const;

    expect(getTermDisplayLabel(terms[0], terms)).toBe(
      'Commenter (commenterLiteral)'
    );
    expect(getTermDisplayLabel(terms[1], terms)).toBe('Commenter (commenter)');
  });

  test('does not automatically map core patterns unavailable to an extension', () => {
    const xml = `<archive><extension rowType="http://rs.tdwg.org/ac/terms/Multimedia"><queries><query name="Multimedia.csv" contextTableId="1">
      <field stringId="1.collectionobject.catalogNumber" />
    </query></queries></extension></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined)
      throw new Error('Extension mapping was not parsed');

    expect(mapping.terms).toEqual([occurrenceId, undefined]);
  });

  test('automatically maps model-backed GBIF extension fields', () => {
    const fields = [
      [
        '1,111-collectionObjectAttachments,41.attachment.title',
        'http://purl.org/dc/terms/title',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.fileCreatedDate',
        'http://rs.tdwg.org/ac/terms/digitizationDate',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.guid',
        'http://purl.org/dc/terms/identifier',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.type',
        'http://purl.org/dc/elements/1.1/type',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.subtype',
        'http://rs.tdwg.org/ac/terms/subtype',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.mimeType',
        'http://purl.org/dc/elements/1.1/format',
      ],
      [
        '1,111-collectionObjectAttachments,41.attachment.attachment',
        'http://rs.tdwg.org/ac/terms/accessURI',
      ],
    ] as const;
    const xml = `<archive><extension rowType="http://rs.tdwg.org/ac/terms/Multimedia"><queries><query name="Multimedia.csv" contextTableId="1">${fields
      .map(([stringId]) => `<field stringId="${stringId}" />`)
      .join('')}</query></queries></extension></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined)
      throw new Error('Extension mapping was not parsed');

    expect(mapping.terms).toEqual([
      occurrenceId,
      ...fields.map(([, term]) => term),
    ]);
  });

  test('limits templates to the matching mapping', () => {
    const coreTemplate = defaultTemplates[0];
    const extensionTemplate = defaultTemplates[1];
    expect(
      getTemplateMapping(coreTemplate, {
        extension: false,
        rowType: 'http://rs.tdwg.org/dwc/terms/Occurrence',
      })?.extension
    ).toBe(false);
    expect(
      getTemplateMapping(extensionTemplate, {
        extension: true,
        rowType: 'http://rs.tdwg.org/ac/terms/Multimedia',
      })?.extension
    ).toBe(true);
    expect(
      getTemplateMapping(extensionTemplate, {
        extension: true,
        rowType: 'http://rs.gbif.org/terms/1.0/MeasurementOrFacts',
      })
    ).toBe(undefined);
  });

  test('automatically maps the expanded core default field patterns', () => {
    const fields = [
      ['1.collectionobject.guid', occurrenceId],
      [
        '1.collectionobject.text1',
        'http://rs.tdwg.org/dwc/terms/collectionCode',
      ],
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
        '1,9-determinations,4.taxon.fullName',
        'http://rs.tdwg.org/dwc/terms/scientificName',
      ],
      [
        '1,9-determinations,4,77-definitionItem.taxontreedefitem.name',
        'http://rs.tdwg.org/dwc/terms/taxonRank',
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
        '1,10.collectingevent.stationFieldNumber',
        'http://rs.tdwg.org/dwc/terms/eventID',
      ],
      [
        '1,10.collectingevent.method',
        'http://rs.tdwg.org/dwc/terms/samplingProtocol',
      ],
      [
        '1,10.collectingevent.startDateVerbatim',
        'http://rs.tdwg.org/dwc/terms/verbatimEventDate',
      ],
      [
        '1,10.collectingevent.endTime',
        'http://rs.tdwg.org/dwc/terms/eventTime',
      ],
      [
        '1,10.collectingevent.verbatimLocality',
        'http://rs.tdwg.org/dwc/terms/verbatimLocality',
      ],
      [
        '1,10,92,4-hostTaxon.taxon.hostTaxon',
        'http://rs.tdwg.org/dwc/terms/associatedTaxa',
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
      [
        '1,93.collectionobjectattribute.text10',
        'http://rs.tdwg.org/dwc/terms/sex',
      ],
      [
        '1,93.collectionobjectattribute.text12',
        'http://rs.tdwg.org/dwc/terms/lifeStage',
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
      [
        '1,10,2.locality.maxElevation',
        'http://rs.tdwg.org/dwc/terms/maximumElevationInMeters',
      ],
      [
        '1,10,2.locality.minElevation',
        'http://rs.tdwg.org/dwc/terms/minimumElevationInMeters',
      ],
      [
        '1,10,2.locality.verbatimElevation',
        'http://rs.tdwg.org/dwc/terms/verbatimElevation',
      ],
      [
        '1,10,2.locality.verbatimLatitude',
        'http://rs.tdwg.org/dwc/terms/verbatimLatitude',
      ],
      [
        '1,10,2.locality.verbatimLongitude',
        'http://rs.tdwg.org/dwc/terms/verbatimLongitude',
      ],
      [
        '1,10,2,123.geoCoordDetails.geocoorddetail.protocol',
        'http://rs.tdwg.org/dwc/terms/georeferenceProtocol',
      ],
      [
        '1,10,2,123.geoCoordDetails.geocoorddetail.geoRefVerificationStatus',
        'http://rs.tdwg.org/dwc/terms/georeferenceVerificationStatus',
      ],
      [
        '1,10,2.localitydetail.waterBody',
        'http://rs.tdwg.org/dwc/terms/waterBody',
      ],
      [
        '1,63-preparations.preparation.preparations',
        'http://rs.tdwg.org/dwc/terms/preparations',
      ],
      [
        '1,10,92.collectingeventattribute.text17',
        'http://rs.tdwg.org/dwc/terms/habitat',
      ],
      ['1,10,2.locality.elevationMethod', undefined],
    ] as const;
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">${fields
      .map(([stringId]) => `<field stringId="${stringId}" />`)
      .join('')}</query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    expect(mapping.terms).toEqual(fields.map(([, term]) => term));
  });

  test('automatically maps newly supported default schema fields', () => {
    const fields = [
      [
        '1,23.collection.collectionName',
        'http://rs.tdwg.org/dwc/terms/datasetName',
      ],
      [
        '1,9-determinations,4.taxon.author',
        'http://rs.tdwg.org/dwc/terms/scientificNameAuthorship',
      ],
      [
        '1,9-determinations.determination.determiner',
        'http://rs.tdwg.org/dwc/terms/identifiedBy',
      ],
      [
        '1,10.collectingevent.endDateVerbatim',
        'http://rs.tdwg.org/dwc/terms/verbatimEventDate',
      ],
      [
        '1,10.collectingevent.verbatimDate',
        'http://rs.tdwg.org/dwc/terms/verbatimEventDate',
      ],
      [
        '1,10,2,3.geography.fullName',
        'http://rs.tdwg.org/dwc/terms/higherGeography',
      ],
    ] as const;

    fields.forEach(([stringId, term]) => {
      const [mapping] = parseDefinition(
        `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1"><field stringId="${stringId}" /></query></queries></core></archive>`
      );
      expect(mapping?.terms).toContain(term);
    });
  });

  test('automatically maps the remaining Darwin Core taxon ranks', () => {
    const fields = [
      [
        '1,9-determinations,4.taxon.Superfamily',
        'http://rs.tdwg.org/dwc/terms/superfamily',
      ],
      [
        '1,9-determinations,4.taxon.Subfamily',
        'http://rs.tdwg.org/dwc/terms/subfamily',
      ],
      [
        '1,9-determinations,4.taxon.Tribe',
        'http://rs.tdwg.org/dwc/terms/tribe',
      ],
      [
        '1,9-determinations,4.taxon.Subtribe',
        'http://rs.tdwg.org/dwc/terms/subtribe',
      ],
      [
        '1,9-determinations,4.taxon.Subgenus',
        'http://rs.tdwg.org/dwc/terms/subgenus',
      ],
      [
        '1,9-determinations,4.taxon.Subgenus',
        'http://rs.tdwg.org/dwc/terms/infragenericEpithet',
      ],
      [
        '1,9-determinations,4.taxon.Genus',
        'http://rs.tdwg.org/dwc/terms/genus',
      ],
      [
        '1,9-determinations,4.taxon.Genus',
        'http://rs.tdwg.org/dwc/terms/genericName',
      ],
      [
        '1,9-determinations,4.taxon.Cultivar',
        'http://rs.tdwg.org/dwc/terms/cultivarEpithet',
      ],
    ] as const;
    const xml = `<archive><core rowType="http://rs.tdwg.org/dwc/terms/Occurrence"><queries><query name="core.csv" contextTableId="1">${fields
      .map(([stringId]) => `<field stringId="${stringId}" />`)
      .join('')}</query></queries></core></archive>`;
    const [mapping] = parseDefinition(xml);
    if (mapping === undefined) throw new Error('Core mapping was not parsed');

    expect(mapping.terms).toEqual([
      occurrenceId,
      ...fields.map(([, term]) => term),
    ]);
  });
});
