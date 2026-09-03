export const occurrenceIdTerm = 'http://rs.tdwg.org/dwc/terms/occurrenceID';

// Darwin Core core mappings. These are also reused by extensions whenever an
// extension exposes the same Darwin Core term.
const darwinCoreTermPatterns: Readonly<Record<string, readonly string[]>> = {
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
  'http://rs.tdwg.org/dwc/terms/basisOfRecord': ['collection.collectiontype'],
  'http://rs.tdwg.org/dwc/terms/datasetName': [
    'collection.description',
    'collection.collectionname',
  ],
  'http://rs.tdwg.org/dwc/terms/datasetID': ['collection.guid'],
  'http://rs.tdwg.org/dwc/terms/institutionID': ['institution.altname'],
  'http://purl.org/dc/terms/license': [
    'institution.copyright',
    'institution.disclaimer',
    'attachment.license',
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
  'http://rs.tdwg.org/dwc/terms/countryCode': [
    'geography.Country geographyCode',
  ],
  'http://rs.tdwg.org/dwc/terms/decimalLatitude': ['locality.latitude1'],
  'http://rs.tdwg.org/dwc/terms/decimalLongitude': ['locality.longitude1'],
  'http://rs.tdwg.org/dwc/terms/individualCount': ['collectionobject.countamt'],
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
  'http://rs.tdwg.org/dwc/terms/specificEpithet': ['taxon.species'],
  'http://rs.tdwg.org/dwc/terms/infraspecificEpithet': ['taxon.subspecies'],
  'http://rs.tdwg.org/dwc/terms/cultivarEpithet': ['taxon.cultivar'],
  'http://rs.tdwg.org/dwc/terms/taxonRank': ['taxontreedefitem.name'],
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
  'http://rs.tdwg.org/dwc/terms/waterBody': ['localitydetail.waterbody'],
  'http://rs.tdwg.org/dwc/terms/catalogNumber': ['.catalognumber'],
  'http://rs.tdwg.org/dwc/terms/recordedBy': ['.collectors'],
  'http://rs.tdwg.org/dwc/terms/stateProvince': ['geography.state'],
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

// GBIF extension mappings. Keep these limited to fields that have a known
// Specify data-model source. Terms in gbifExtensions.json without a reliable
// source stay available for manual mapping instead of receiving a guess.
const gbifExtensionTermPatterns: Readonly<Record<string, readonly string[]>> = {
  // Audiovisual Core (AC) and the GBIF media extensions.
  'http://purl.org/dc/terms/identifier': [
    'attachment.guid',
    'referencework.guid',
  ],
  'http://purl.org/dc/elements/1.1/type': ['attachment.type'],
  'http://purl.org/dc/terms/type': [
    'attachment.type',
    'referencework.referenceworktype',
  ],
  'http://rs.tdwg.org/ac/terms/subtype': ['attachment.subtype'],
  'http://rs.tdwg.org/audubon_core/subtype': ['attachment.subtype'],
  'http://purl.org/dc/terms/title': ['attachment.title', 'referencework.title'],
  'http://purl.org/dc/terms/description': [
    'attachment.metadatatext',
    'referencework.remarks',
  ],
  'http://purl.org/dc/elements/1.1/format': ['attachment.mimetype'],
  'http://purl.org/dc/terms/format': ['attachment.mimetype'],
  'http://purl.org/dc/terms/created': [
    'attachment.filecreateddate',
    'attachment.dateimaged',
    'referencework.workdate',
  ],
  'http://purl.org/dc/terms/date': ['referencework.workdate'],
  'http://purl.org/dc/terms/publisher': [
    'institution.name',
    'referencework.publisher',
  ],
  'http://purl.org/dc/terms/rightsHolder': [
    'attachment.copyrightholder',
    'institution.name',
  ],
  'http://purl.org/dc/terms/source': ['referencework.uri', 'institution.uri'],
  'http://rs.tdwg.org/ac/terms/digitizationDate': [
    'attachment.filecreateddate',
    'attachment.dateimaged',
  ],
  'http://rs.tdwg.org/ac/terms/captureDevice': ['attachment.capturedevice'],
  'http://rs.tdwg.org/ac/terms/subjectOrientation': [
    'attachment.subjectorientation',
  ],
  'http://rs.tdwg.org/ac/terms/licenseLogoURL': ['attachment.licenselogourl'],
  'http://rs.tdwg.org/ac/terms/accessURI': [
    // This is a formatted Attachment relationship field exposed by QueryBuilder.
    'attachment.attachment',
  ],

  // GBIF Types and Specimen / Identification extensions.
  'http://rs.tdwg.org/dwc/terms/collectionID': ['collection.guid'],
  'http://rs.gbif.org/terms/1.0/verbatimLabel': ['collectionobject.remarks'],
  'http://rs.tdwg.org/dwc/terms/identificationID': ['determination.guid'],
  'http://rs.tdwg.org/dwc/terms/identificationQualifier': [
    'determination.qualifier',
  ],
  'http://rs.tdwg.org/dwc/terms/identificationRemarks': [
    'determination.remarks',
  ],
  'http://rs.tdwg.org/dwc/terms/taxonID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/scientificNameID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/acceptedNameUsageID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/parentNameUsageID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/originalNameUsageID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/nameAccordingToID': ['referencework.guid'],
  'http://rs.tdwg.org/dwc/terms/namePublishedInID': ['referencework.guid'],
  'http://rs.tdwg.org/dwc/terms/taxonConceptID': ['taxon.guid'],
  'http://rs.tdwg.org/dwc/terms/taxonRemarks': ['taxon.remarks'],
  'http://rs.tdwg.org/dwc/terms/vernacularName': ['taxon.commonname'],

  // GBIF Reference and EOL reference extensions.
  'http://purl.org/ontology/bibo/pages': ['referencework.pages'],
  'http://purl.org/ontology/bibo/volume': ['referencework.volume'],
  'http://purl.org/ontology/bibo/uri': ['referencework.uri'],
  'http://purl.org/ontology/bibo/doi': ['referencework.doi'],
  'http://eol.org/schema/reference/publicationType': [
    'referencework.referenceworktype',
  ],
  'http://eol.org/schema/reference/primaryTitle': ['referencework.title'],

  // Chronometric Age / Date extensions.
  'http://rs.tdwg.org/chrono/terms/verbatimChronometricAge': [
    'absoluteage.absoluteage',
    'relativeage.verbatimname',
  ],
  'http://zooarchnet.org/dwc/terms/verbatimChronometricAge': [
    'absoluteage.absoluteage',
    'relativeage.verbatimname',
  ],
  'http://rs.tdwg.org/chrono/terms/chronometricAgeProtocol': [
    'absoluteage.datingmethod',
    'relativeage.datingmethod',
  ],
  'http://zooarchnet.org/dwc/terms/chronometricAgeProtocol': [
    'absoluteage.datingmethod',
    'relativeage.datingmethod',
  ],
  'http://zooarchnet.org/dwc/terms/chronometricDateProtocol': [
    'absoluteage.datingmethod',
    'relativeage.datingmethod',
  ],
  'http://rs.tdwg.org/chrono/terms/chronometricAgeUncertaintyInYears': [
    'absoluteage.ageuncertainty',
    'relativeage.ageuncertainty',
  ],
  'http://zooarchnet.org/dwc/terms/chronometricAgeUncertaintyInYears': [
    'absoluteage.ageuncertainty',
    'relativeage.ageuncertainty',
  ],
  'http://rs.tdwg.org/chrono/terms/chronometricAgeDeterminedDate': [
    'absoluteage.date1',
    'relativeage.date1',
  ],
  'http://rs.tdwg.org/chrono/terms/chronometricAgeRemarks': [
    'absoluteage.remarks',
    'relativeage.remarks',
  ],
  'http://zooarchnet.org/dwc/terms/chronometricAgeRemarks': [
    'absoluteage.remarks',
    'relativeage.remarks',
  ],

  // GGBN DNA, material sample, loan, and permit extensions.
  'http://rs.gbif.org/terms/pcr_primer_forward': [
    'dnaprimer.primersequenceforward',
  ],
  'http://rs.gbif.org/terms/pcr_primer_reverse': [
    'dnaprimer.primersequencereverse',
  ],
  'http://rs.gbif.org/terms/pcr_primer_name_forward': [
    'dnaprimer.primernameforward',
  ],
  'http://rs.gbif.org/terms/pcr_primer_name_reverse': [
    'dnaprimer.primernamereverse',
  ],
  'http://rs.gbif.org/terms/pcr_primer_reference': [
    'dnaprimer.primerreferencecitationforward',
    'dnaprimer.primerreferencecitationreverse',
  ],
  'http://rs.gbif.org/terms/dna_sequence': ['dnasequence.genesequence'],
  'http://data.ggbn.org/schemas/ggbn/terms/materialSampleType': [
    'materialsample.ggbn_materialsampletype',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/concentration': [
    'materialsample.ggbn_concentration',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/concentrationUnit': [
    'materialsample.ggbn_concentrationunit',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/ratioOfAbsorbance260_230': [
    'materialsample.ggbn_absorbanceratio260_230',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/ratioOfAbsorbance260_280': [
    'materialsample.ggbn_absorbanceratio260_280',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/volume': [
    'materialsample.ggbn_volume',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/volumeUnit': [
    'materialsample.ggbn_volumeunit',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/weight': [
    'materialsample.ggbn_weight',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/weightUnit': [
    'materialsample.ggbn_weightunit',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/purificationMethod': [
    'materialsample.ggbn_purificationmethod',
    'dnaprimer.purificationmethod',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/qualityCheckDate': [
    'materialsample.ggbn_qualitycheckdate',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/quality': [
    'materialsample.ggbn_quality',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/qualityRemarks': [
    'materialsample.ggbn_qualityremarks',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/sampleDesignation': [
    'materialsample.ggbn_sampledesignation',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/permitType': ['permit.type'],
  'http://data.ggbn.org/schemas/ggbn/terms/permitStatus': ['permit.status'],
  'http://data.ggbn.org/schemas/ggbn/terms/permitStatusQualifier': [
    'permit.statusqualifier',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/permitText': ['permit.permittext'],
  'http://data.ggbn.org/schemas/ggbn/terms/blockedUntil': [
    'loan.currentduedate',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/loanConditions': [
    'loan.specialconditions',
  ],
  'http://data.ggbn.org/schemas/ggbn/terms/loanDate': ['loan.loandate'],
  'http://data.ggbn.org/schemas/ggbn/terms/loanIdentifier': ['loan.loannumber'],
  'http://purl.org/dc/terms/disposition': ['loan.purposeofloan'],
};

export const coreTermPatterns: Readonly<Record<string, readonly string[]>> = {
  ...darwinCoreTermPatterns,
  ...gbifExtensionTermPatterns,
};
