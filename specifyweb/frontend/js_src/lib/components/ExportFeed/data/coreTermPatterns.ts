export const occurrenceIdTerm = 'http://rs.tdwg.org/dwc/terms/occurrenceID';

export const coreTermPatterns: Readonly<Record<string, readonly string[]>> = {
  // These must precede eventDate because numeric date-part IDs also contain
  // "collectingevent.startdate".
  'http://rs.tdwg.org/dwc/terms/day': ['collectingevent.startdatenumericday'],
  'http://rs.tdwg.org/dwc/terms/month': [
    'collectingevent.startdatenumericmonth',
  ],
  'http://rs.tdwg.org/dwc/terms/year': ['collectingevent.startdatenumericyear'],
  'http://rs.tdwg.org/dwc/terms/verbatimEventDate': [
    'collectingevent.startdateverbatim',
    'collectingevent.enddateverbatim',
    'collectingevent.verbatimdate',
  ],
  'http://rs.tdwg.org/dwc/terms/eventDate': [
    'collectingevent.startdate',
    'collectingevent.enddate',
  ],
  'http://rs.tdwg.org/dwc/terms/basisOfRecord': [
    'collection.collectiontype',
  ],
  'http://rs.tdwg.org/dwc/terms/datasetName': [
    'collection.description',
    'collection.collectionname',
  ],
  'http://rs.tdwg.org/dwc/terms/datasetID': ['collection.guid'],
  'http://rs.tdwg.org/dwc/terms/institutionID': ['institution.altname'],
  'http://purl.org/dc/terms/license': [
    'institution.copyright',
    'institution.disclaimer',
  ],
  'http://purl.org/dc/terms/accessRights': ['institution.termsofuse'],
  'http://purl.org/dc/terms/modified': ['.timestampmodified'],
  'http://rs.tdwg.org/dwc/terms/otherCatalogNumbers': ['.altcatalognumber'],
  'http://rs.tdwg.org/dwc/terms/scientificName': [
    'preferredtaxon.fullname',
    'taxon.fullname',
  ],
  'http://rs.tdwg.org/dwc/terms/scientificNameAuthorship': [
    'taxon.species author',
    'taxon.author',
  ],
  [occurrenceIdTerm]: ['collectionobject.guid'],
  'http://rs.tdwg.org/dwc/terms/continent': ['geography.continent'],
  'http://rs.tdwg.org/dwc/terms/country': ['geography.country'],
  'http://rs.tdwg.org/dwc/terms/eventTime': [
    'collectingevent.starttime',
    'collectingevent.endtime',
  ],
  'http://rs.tdwg.org/dwc/terms/geodeticDatum': ['locality.datum'],
  'http://rs.tdwg.org/dwc/terms/coordinateUncertaintyInMeters': [
    'geocoorddetail.maxuncertaintyest',
  ],
  // This only works if the rank is named exactly 'Country'
  'http://rs.tdwg.org/dwc/terms/countryCode': ['geography.Country geographyCode'],
  'http://rs.tdwg.org/dwc/terms/decimalLatitude': ['locality.latitude1'],
  'http://rs.tdwg.org/dwc/terms/decimalLongitude': ['locality.longitude1'],
  'http://rs.tdwg.org/dwc/terms/individualCount': [
    'collectionobject.countamt',
  ],
  'http://rs.tdwg.org/dwc/terms/organismQuantity': [
    'collectionobject.countamt',
  ],
  'http://rs.tdwg.org/dwc/terms/kingdom': ['taxon.kingdom'],
  'http://rs.tdwg.org/dwc/terms/phylum': ['taxon.phylum'],
  'http://rs.tdwg.org/dwc/terms/class': ['taxon.class'],
  'http://rs.tdwg.org/dwc/terms/order': ['taxon.order'],
  'http://rs.tdwg.org/dwc/terms/superfamily': ['taxon.superfamily'],
  'http://rs.tdwg.org/dwc/terms/family': ['taxon.family'],
  'http://rs.tdwg.org/dwc/terms/subfamily': ['taxon.subfamily'],
  'http://rs.tdwg.org/dwc/terms/tribe': ['taxon.tribe'],
  'http://rs.tdwg.org/dwc/terms/subtribe': ['taxon.subtribe'],
  'http://rs.tdwg.org/dwc/terms/genus': ['taxon.genus'],
  'http://rs.tdwg.org/dwc/terms/genericName': ['taxon.genus'],
  'http://rs.tdwg.org/dwc/terms/subgenus': ['taxon.subgenus'],
  'http://rs.tdwg.org/dwc/terms/infragenericEpithet': ['taxon.subgenus'],
  'http://rs.tdwg.org/dwc/terms/specificEpithet': [
    'taxon.species',
  ],
  'http://rs.tdwg.org/dwc/terms/infraspecificEpithet': [
    'taxon.subspecies',
  ],
  'http://rs.tdwg.org/dwc/terms/cultivarEpithet': ['taxon.cultivar'],
  'http://rs.tdwg.org/dwc/terms/taxonRank': [
    'taxontreedefitem.name',
  ],
  'http://rs.tdwg.org/dwc/terms/eventID': [
    'collectingevent.guid',
    'collectingevent.stationfieldnumber',
  ],
  'http://rs.tdwg.org/dwc/terms/recordNumber': ['fieldnumber'],
  'http://rs.tdwg.org/dwc/terms/identifiedBy': [
    'agent.determiner',
    'determination.determiner',
    'determiner.determiners',
  ],
  'http://rs.tdwg.org/dwc/terms/typeStatus': ['determination.typestatusname'],
  'http://rs.tdwg.org/dwc/terms/parentEventID': ['collectingtrip.guid'],
  'http://rs.tdwg.org/dwc/terms/waterBody': [
    'localitydetail.waterbody',
  ],
  'http://rs.tdwg.org/dwc/terms/catalogNumber': ['.catalognumber'],
  'http://rs.tdwg.org/dwc/terms/recordedBy': ['.collectors'],
  'http://rs.tdwg.org/dwc/terms/stateProvince': [
    'geography.state',
  ],
  'http://rs.tdwg.org/dwc/terms/county': ['geography.county'],
  'http://rs.tdwg.org/dwc/terms/maximumDepthInMeters': [
    'localitydetail.enddepth',
  ],
  'http://rs.tdwg.org/dwc/terms/minimumDepthInMeters': [
    'localitydetail.startdepth',
  ],
  'http://rs.tdwg.org/dwc/terms/locality': ['locality.localityname'],
  'http://rs.tdwg.org/dwc/terms/island': ['localitydetail.island'],
  'http://rs.tdwg.org/dwc/terms/islandGroup': ['localitydetail.islandgroup'],
  'http://rs.tdwg.org/dwc/terms/locationRemarks': ['locality.remarks'],
  'http://rs.tdwg.org/dwc/terms/georeferenceSources': [
    'locality.latlongmethod',
  ],
  'http://rs.tdwg.org/dwc/terms/collectionCode': [
    'collection.code',
  ],
  'http://rs.tdwg.org/dwc/terms/eventRemarks': ['collectingevent.remarks'],
  'http://rs.tdwg.org/dwc/terms/institutionCode': ['institution.code'],
  'http://rs.tdwg.org/dwc/terms/fieldNumber': ['fieldnumber'],
  'http://rs.tdwg.org/dwc/terms/dateIdentified': ['determineddate'],
  'http://rs.tdwg.org/dwc/terms/locationID': ['locality.guid'],
  'http://rs.tdwg.org/dwc/terms/georeferenceRemarks': [
    'geocoorddetail.georefremarks',
  ],
  'http://rs.tdwg.org/dwc/terms/georeferencedDate': [
    'geocoorddetail.georefdetdate',
  ],
  'http://rs.tdwg.org/dwc/terms/georeferencedBy': ['georefdetby'],
  'http://rs.tdwg.org/dwc/terms/georeferenceProtocol': [
    'geocoorddetail.protocol',
  ],
  'http://rs.tdwg.org/dwc/terms/georeferenceVerificationStatus': [
    'geocoorddetail.georefverificationstatus',
  ],
  'http://rs.tdwg.org/dwc/terms/higherGeography': [
    'geography.geography',
    'geography.fullname',
  ],
  'http://rs.tdwg.org/dwc/terms/samplingProtocol': ['collectingevent.method'],
  'http://rs.tdwg.org/dwc/terms/verbatimLocality': [
    'collectingevent.verbatimlocality',
  ],
  'http://rs.tdwg.org/dwc/terms/associatedTaxa': ['hosttaxon.taxon.hosttaxon'],
  'http://rs.tdwg.org/dwc/terms/preparations': [
    'preparations.preparation.preparations',
  ],
  'http://rs.tdwg.org/dwc/terms/occurrenceRemarks': ['.remarks'],
  'http://rs.tdwg.org/dwc/terms/maximumElevationInMeters': [
    'locality.maxelevation',
  ],
  'http://rs.tdwg.org/dwc/terms/minimumElevationInMeters': [
    'locality.minelevation',
  ],
  'http://rs.tdwg.org/dwc/terms/verbatimElevation': [
    'locality.verbatimelevation',
  ],
  'http://rs.tdwg.org/dwc/terms/verbatimLatitude': [
    'locality.verbatimlatitude',
  ],
  'http://rs.tdwg.org/dwc/terms/verbatimLongitude': [
    'locality.verbatimlongitude',
  ],
};
