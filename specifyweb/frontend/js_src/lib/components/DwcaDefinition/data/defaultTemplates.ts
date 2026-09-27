export type DwcaTemplate = {
  readonly name: string;
  readonly coreRowTypes?: readonly string[];
  readonly disciplineTypes?: readonly string[];
  readonly definition: string;
  readonly targets: readonly {
    readonly extension: boolean;
    readonly rowType: string;
  }[];
};

/** Shared starting points supplied with Specify. These remain XML so the
 * visual editor can load them using the same path as user-created resources.
 */
const occurrenceTemplate: DwcaTemplate = {
  name: 'Specify → Darwin Core Occurrence',
  coreRowTypes: ['http://rs.tdwg.org/dwc/terms/Occurrence'],
  targets: [
    {
      extension: false,
      rowType: 'http://rs.tdwg.org/dwc/terms/Occurrence',
    },
  ],
  definition: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <core rowType="http://rs.tdwg.org/dwc/terms/Occurrence">
    <queries>
      <query name="occurrence.csv" contextTableId="1">
        <id stringId="1.collectionobject.guid" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/occurrenceID"/>
        <field stringId="1.collectionobject.catalogNumber" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/catalogNumber"/>
        <field stringId="1.collectionobject.text1" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/collectionCode"/>
        <field stringId="1.collectionobject.timestampModified" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/modified"/>
        <field stringId="1,23,26,96,94.institution.code" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/institutionCode"/>
        <field stringId="1,23,26,96,94.institution.guid" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/institutionID"/>
        <field stringId="1,23,26,96,94.institution.termsOfUse" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/accessRights"/>
        <field stringId="1,23.collection.description" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/datasetName"/>
        <field stringId="1,23.collection.guid" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/datasetID"/>
        <field stringId="1,9-determinations,4.taxon.Kingdom" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/kingdom"/>
        <field stringId="1,9-determinations,4.taxon.Phylum" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/phylum"/>
        <field stringId="1,9-determinations,4.taxon.Class" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/class"/>
        <field stringId="1,9-determinations,4.taxon.Order" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/order"/>
        <field stringId="1,9-determinations,4.taxon.Family" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/family"/>
        <field stringId="1,9-determinations,4.taxon.Genus" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/genus"/>
        <field stringId="1,9-determinations,4.taxon.Species" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/specificEpithet"/>
        <field stringId="1,9-determinations,4.taxon.Subspecies" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/infraspecificEpithet"/>
        <field stringId="1,9-determinations,4,77-definitionItem.taxontreedefitem.name" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/taxonRank"/>
        <field stringId="1,9-determinations,4.taxon.fullName" oper="12" value="" isNot="true" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/scientificName"/>
        <field stringId="1,9-determinations.determination.typeStatusName" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/typeStatus"/>
        <field stringId="1,9-determinations.determination.determinedDate" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/dateIdentified"/>
        <field stringId="1,9-determinations,5-determiner.agent.determiner" oper="8" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/dwc/terms/identifiedBy"/>
        <field stringId="1,10.collectingevent.stationFieldNumber" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/eventID"/>
        <field stringId="1,10.collectingevent.method" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/samplingProtocol"/>
        <field stringId="1,10.collectingevent.startDate" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/eventDate"/>
        <field stringId="1,10.collectingevent.startDateNumericDay" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/day"/>
        <field stringId="1,10.collectingevent.startDateNumericMonth" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/month"/>
        <field stringId="1,10.collectingevent.startDateNumericYear" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/year"/>
        <field stringId="1,10.collectingevent.startDateVerbatim" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/verbatimEventDate"/>
        <field stringId="1,10.collectingevent.verbatimLocality" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/verbatimLocality"/>
        <field stringId="1,10.collectingevent.remarks" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/eventRemarks"/>
        <field stringId="1,10,30-collectors.collector.collectors" oper="8" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/dwc/terms/recordedBy"/>
        <field stringId="1,10,2,3.geography.Continent" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/continent"/>
        <field stringId="1,10,2,3.geography.Country" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/country"/>
        <field stringId="1,10,2,3.geography.State" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/stateProvince"/>
        <field stringId="1,10,2,3.geography.County" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/county"/>
        <field stringId="1,10,2,3.geography.fullName" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/higherGeography"/>
        <field stringId="1,10,92,4-hostTaxon.taxon.hostTaxon" oper="8" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/dwc/terms/associatedTaxa"/>
        <field stringId="1,10,2.locality.localityName" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/locality"/>
        <field stringId="1,10,2.locality.latitude1" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/decimalLatitude"/>
        <field stringId="1,10,2.locality.longitude1" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/decimalLongitude"/>
        <field stringId="1,10,2.locality.datum" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/geodeticDatum"/>
        <field stringId="1,10,2.locality.remarks" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/locationRemarks"/>
        <field stringId="1,10,2.locality.minElevation" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/minimumElevationInMeters"/>
        <field stringId="1,10,2.locality.maxElevation" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/maximumElevationInMeters"/>
        <field stringId="1,63-preparations.preparation.preparations" oper="8" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/dwc/terms/preparations"/>
      </query>
    </queries>
  </core>
</archive>`,
};

type DisciplineField = {
  readonly stringId: string;
  readonly term: string;
};

const disciplineFields: Readonly<Record<string, readonly DisciplineField[]>> = {
  bird: [
    {
      stringId: '1,93.collectionobjectattribute.text2',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
  ],
  fish: [
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text4',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
    {
      stringId: '1,10,92.collectingeventattribute.text9',
      term: 'http://rs.tdwg.org/dwc/terms/habitat',
    },
    {
      stringId: '1,10,92.collectingeventattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/minimumDepthInMeters',
    },
    {
      stringId: '1,10,92.collectingeventattribute.text2',
      term: 'http://rs.tdwg.org/dwc/terms/maximumDepthInMeters',
    },
  ],
  herpetology: [
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text4',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
  ],
  insect: [
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text4',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
  ],
  invertebrate: [
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text4',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
  ],
  mammal: [
    {
      stringId: '1,93.collectionobjectattribute.text1',
      term: 'http://rs.tdwg.org/dwc/terms/sex',
    },
    {
      stringId: '1,93.collectionobjectattribute.text4',
      term: 'http://rs.tdwg.org/dwc/terms/lifeStage',
    },
  ],
};

const disciplineNames: Readonly<Record<string, string>> = {
  bird: 'Bird',
  fish: 'Fish',
  herpetology: 'Herpetology',
  insect: 'Insect',
  invertebrate: 'Invertebrate',
  mammal: 'Mammal',
};

function makeDisciplineOccurrenceTemplate(
  disciplineType: string,
  fields: readonly DisciplineField[]
): DwcaTemplate {
  const fieldXml = fields
    .map(
      ({ stringId, term }) =>
        `        <field stringId="${stringId}" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="${term}"/>`
    )
    .join('\n');
  return {
    ...occurrenceTemplate,
    name: `Specify → Darwin Core Occurrence (${disciplineNames[disciplineType]})`,
    disciplineTypes: [disciplineType],
    definition: occurrenceTemplate.definition.replace(
      '      </query>',
      `${fieldXml}\n      </query>`
    ),
  };
}

export const defaultTemplates: readonly DwcaTemplate[] = [
  occurrenceTemplate,
  {
    name: 'Specify → Audiovisual Core',
    coreRowTypes: ['http://rs.tdwg.org/dwc/terms/Occurrence'],
    targets: [
      {
        extension: true,
        rowType: 'http://rs.tdwg.org/ac/terms/Multimedia',
      },
    ],
    definition: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <extension rowType="http://rs.tdwg.org/ac/terms/Multimedia">
    <queries>
      <query name="AudiovisualCore.csv" contextTableId="1">
        <id stringId="1.collectionobject.guid" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/occurrenceID"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.title" oper="12" value="" isNot="true" isRelFld="false" formatName="" term="http://purl.org/dc/terms/title"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.fileCreatedDate" oper="1" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/ac/terms/digitizationDate"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.guid" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/identifier"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.credit" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/elements/1.1/creator"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.type" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/type"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.subtype" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/ac/terms/subtype"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.mimeType" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/elements/1.1/format"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.subjectOrientation" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/ac/terms/subjectOrientation"/>
        <field stringId="1,111-collectionObjectAttachments,41.attachment.attachment" oper="11" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/ac/terms/accessURI"/>
        <field stringId="1,23,26,96,94.institution.copyright" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://ns.adobe.com/xap/1.0/rights/UsageTerms"/>
        <field stringId="1,23,26,96,94.institution.termsOfUse" oper="11" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/rights"/>
      </query>
    </queries>
  </extension>
</archive>`,
  },
  {
    name: 'Specify → EOL References Extension',
    coreRowTypes: ['http://rs.tdwg.org/dwc/terms/Occurrence'],
    targets: [
      {
        extension: true,
        rowType: 'http://eol.org/schema/reference/Reference',
      },
    ],
    definition: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
	<extension rowType="http://eol.org/schema/reference/Reference">
		<queries>
			<query name="EOLrefcore.csv" contextTableId="1">
				<id term="http://rs.tdwg.org/dwc/terms/occurrenceID" isNot="false" isRelFld="false" stringId="1.collectionobject.guid" oper="8" value=""/>
				<field term="http://eol.org/schema/reference/publicationType" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.referenceWorkType" value=""/>
				<field term="http://purl.org/ontology/bibo/authorList" isNot="false" isRelFld="true" oper="8" stringId="1,29-collectionObjectCitations,69,17-authors.author.authors" value=""/>
				<field term="http://purl.org/dc/terms/title" isNot="true" isRelFld="false" oper="12" stringId="1,29-collectionObjectCitations,69.referencework.title" value=""/>
				<field term="http://purl.org/ontology/bibo/doi" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.text2" value=""/>
				<field term="http://purl.org/dc/terms/identifier" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.guid" value=""/>
				<field term="http://purl.org/dc/terms/created" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.workDate" value=""/>
				<field term="http://eol.org/schema/reference/primaryTitle" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69,51.journal.journalName" value=""/>
				<field term="http://purl.org/ontology/bibo/volume" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.volume" value=""/>
				<field term="http://purl.org/ontology/bibo/pages" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.pages" value=""/>
				<field term="http://purl.org/dc/terms/publisher" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.publisher" value=""/>
				<field term="http://schemas.talis.com/2005/address/schema#localityName" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.placeOfPublication" value=""/>
				<field term="http://purl.org/ontology/bibo/uri" isNot="false" isRelFld="false" oper="8" stringId="1,29-collectionObjectCitations,69.referencework.url" value=""/>
			</query>
		</queries>
	</extension>
</archive>`,
  },
  {
    name: 'Specify → Identification History Extension',
    coreRowTypes: ['http://rs.tdwg.org/dwc/terms/Occurrence'],
    targets: [
      {
        extension: true,
        rowType: 'http://rs.tdwg.org/dwc/terms/Identification',
      },
    ],
    definition: `<?xml version="1.0" encoding="UTF-8"?>
<archive>
  <extension rowType="http://rs.tdwg.org/dwc/terms/Identification">
    <queries>
      <query name="Identification.csv" contextTableId="1">
        <id stringId="1.collectionobject.guid" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/occurrenceID"/>
        <field stringId="1,9-determinations.determination.guid" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/identificationID"/>
        <field stringId="1,9-determinations.determination.remarks" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/identificationRemarks"/>
        <field stringId="1,9-determinations.determination.determinedDate" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/dateIdentified"/>
        <field stringId="1,9-determinations,5-determiner.agent.determiner" oper="8" value="" isNot="false" isRelFld="true" formatName="" term="http://rs.tdwg.org/dwc/terms/identifiedBy"/>
        <field stringId="1,9-determinations.determination.qualifier" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/identificationQualifier"/>
        <field stringId="1,9-determinations.determination.typeStatusName" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/typeStatus"/>
        <field stringId="1,9-determinations.determination.confidence" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/taxonRemarks"/>
        <field stringId="1,9-determinations,4.taxon.Kingdom" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/kingdom"/>
        <field stringId="1,9-determinations,4.taxon.Phylum" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/phylum"/>
        <field stringId="1,9-determinations,4.taxon.Class" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/class"/>
        <field stringId="1,9-determinations,4.taxon.Order" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/order"/>
        <field stringId="1,9-determinations,4.taxon.Superfamily" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/superfamily"/>
        <field stringId="1,9-determinations,4.taxon.Family" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/family"/>
        <field stringId="1,9-determinations,4.taxon.Subfamily" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/subfamily"/>
        <field stringId="1,9-determinations,4.taxon.Tribe" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/tribe"/>
        <field stringId="1,9-determinations,4.taxon.Subtribe" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/subtribe"/>
        <field stringId="1,9-determinations,4.taxon.Genus" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/genus"/>
        <field stringId="1,9-determinations,4.taxon.Subgenus" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/subgenus"/>
        <field stringId="1,9-determinations,4.taxon.Species" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/specificEpithet"/>
        <field stringId="1,9-determinations,4.taxon.Subspecies" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/infraspecificEpithet"/>
      </query>
    </queries>
    <coreid index="0"/>
  </extension>
</archive>`,
  },
  ...Object.entries(disciplineFields).map(([disciplineType, fields]) =>
    makeDisciplineOccurrenceTemplate(disciplineType, fields)
  ),
];
