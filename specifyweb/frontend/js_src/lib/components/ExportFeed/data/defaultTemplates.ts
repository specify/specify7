export type DwcaTemplate = {
  readonly name: string;
  readonly definition: string;
  readonly targets: readonly {
    readonly extension: boolean;
    readonly rowType: string;
  }[];
};

/** Shared starting points supplied with Specify. These remain XML so the
 * visual editor can load them using the same path as user-created resources.
 */
export const defaultTemplates: readonly DwcaTemplate[] = [
  {
    name: 'Specify → Darwin Core Occurrence',
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
        <field stringId="1,23,26,96,94.institution.altName" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/institutionID"/>
        <field stringId="1,23,26,96,94.institution.copyright" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/license"/>
        <field stringId="1,23,26,96,94.institution.termsOfUse" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://purl.org/dc/terms/accessRights"/>
        <field stringId="1,23.collection.collectionType" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/basisOfRecord"/>
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
        <field stringId="1,10,92.collectingeventattribute.text17" oper="8" value="" isNot="false" isRelFld="false" formatName="" term="http://rs.tdwg.org/dwc/terms/habitat"/>
      </query>
    </queries>
  </core>
</archive>`,
  },
  {
    name: 'Specify → Audiovisual Core',
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
];
