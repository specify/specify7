"""Default DwC Core mapping field definitions.

Each entry is a dict with: fieldname, stringid, tablelist, term (DwC IRI).
These match what the Query Builder would produce for these Specify fields.
"""

DWC_TERMS_URI = 'http://rs.tdwg.org/dwc/terms/'

DEFAULT_CORE_FIELDS = [
    # occurrenceID is handled separately as the locked first row
    {'fieldname': 'catalogNumber', 'stringid': '1.collectionobject.catalogNumber',
     'tablelist': '1', 'term': DWC_TERMS_URI + 'catalogNumber'},
    {'fieldname': 'fullName', 'stringid': '1,9-determinations,4.taxon.fullName',
     'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'scientificName'},
    {'fieldname': 'author', 'stringid': '1,9-determinations,4.taxon.author',
     'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'scientificNameAuthorship'},
    {'fieldname': 'family', 'stringid': '1,9-determinations,4.taxon.Family',
     'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'family'},
    {'fieldname': 'genus', 'stringid': '1,9-determinations,4.taxon.Genus',
     'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'genus'},
    {'fieldname': 'species', 'stringid': '1,9-determinations,4.taxon.Species',
     'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'specificEpithet'},
    {'fieldname': 'lastName', 'stringid': '1,10,30-collectors,5.agent.lastName',
     'tablelist': '1,10,30-collectors,5', 'term': DWC_TERMS_URI + 'recordedBy'},
    {'fieldname': 'startDate', 'stringid': '1,10.collectingevent.startDate',
     'tablelist': '1,10', 'term': DWC_TERMS_URI + 'eventDate'},
    {'fieldname': 'startDateNumericYear', 'stringid': '1,10.collectingevent.startDateNumericYear',
     'tablelist': '1,10', 'term': DWC_TERMS_URI + 'year'},
    {'fieldname': 'startDateNumericMonth', 'stringid': '1,10.collectingevent.startDateNumericMonth',
     'tablelist': '1,10', 'term': DWC_TERMS_URI + 'month'},
    {'fieldname': 'startDateNumericDay', 'stringid': '1,10.collectingevent.startDateNumericDay',
     'tablelist': '1,10', 'term': DWC_TERMS_URI + 'day'},
    {'fieldname': 'country', 'stringid': '1,10,2,3.geography.Country',
     'tablelist': '1,10,2,3', 'term': DWC_TERMS_URI + 'country'},
    {'fieldname': 'state', 'stringid': '1,10,2,3.geography.State',
     'tablelist': '1,10,2,3', 'term': DWC_TERMS_URI + 'stateProvince'},
    {'fieldname': 'county', 'stringid': '1,10,2,3.geography.County',
     'tablelist': '1,10,2,3', 'term': DWC_TERMS_URI + 'county'},
    {'fieldname': 'localityName', 'stringid': '1,10,2.locality.localityName',
     'tablelist': '1,10,2', 'term': DWC_TERMS_URI + 'locality'},
    {'fieldname': 'latitude1', 'stringid': '1,10,2.locality.latitude1',
     'tablelist': '1,10,2', 'term': DWC_TERMS_URI + 'decimalLatitude'},
    {'fieldname': 'longitude1', 'stringid': '1,10,2.locality.longitude1',
     'tablelist': '1,10,2', 'term': DWC_TERMS_URI + 'decimalLongitude'},
    {'fieldname': 'datum', 'stringid': '1,10,2.locality.datum',
     'tablelist': '1,10,2', 'term': DWC_TERMS_URI + 'geodeticDatum'},
    {'fieldname': 'code', 'stringid': '1,23.collection.code',
     'tablelist': '1,23', 'term': DWC_TERMS_URI + 'collectionCode'},
    {'fieldname': 'altCatalogNumber', 'stringid': '1.collectionobject.altCatalogNumber',
     'tablelist': '1', 'term': DWC_TERMS_URI + 'otherCatalogNumbers'},
    {'fieldname': 'remarks', 'stringid': '1.collectionobject.remarks',
     'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceRemarks'},
]


def create_default_core_mapping(collection, user):
    """Create the default DwC Occurrence Core mapping for a collection.

    Returns the created SchemaMapping instance.
    """
    from specifyweb.specify.models import Spquery, Spqueryfield
    from .models import SchemaMapping

    # Check if default already exists
    existing = SchemaMapping.objects.filter(
        name='DwC Occurrence (Default)',
        isdefault=True,
    ).first()
    if existing:
        return existing

    # Create backing query
    query = Spquery.objects.create(
        name='DwC Occurrence (Default)',
        contextname='CollectionObject',
        contexttableid=1,
        createdbyagent=user.agents.first() if user else None,
        specifyuser=user,
        isfavorite=False,
    )

    # Create occurrenceID field (position 0)
    Spqueryfield.objects.create(
        query=query,
        fieldname='guid',
        stringid='1.collectionobject.guid',
        tablelist='1',
        position=0,
        sorttype=0,
        isdisplay=True,
        isnot=False,
        operstart=8,
        startvalue='',
        term='http://rs.tdwg.org/dwc/terms/occurrenceID',
    )

    # Create remaining fields
    for i, field_def in enumerate(DEFAULT_CORE_FIELDS):
        Spqueryfield.objects.create(
            query=query,
            fieldname=field_def['fieldname'],
            stringid=field_def['stringid'],
            tablelist=field_def['tablelist'],
            position=i + 1,
            sorttype=0,
            isdisplay=True,
            isnot=False,
            operstart=8,
            startvalue='',
            term=field_def['term'],
        )

    # Create mapping
    mapping = SchemaMapping.objects.create(
        query=query,
        mappingtype='Core',
        name='DwC Occurrence (Default)',
        isdefault=True,
    )

    return mapping


# Extension default field definitions
AC_TERMS_URI = 'http://rs.tdwg.org/ac/terms/'
GGBN_TERMS_URI = 'http://data.ggbn.org/schemas/ggbn/terms/'

DEFAULT_EXTENSION_DEFS = [
    {
        'name': 'Identification History (Default)',
        'fields': [
            {'fieldname': 'guid', 'stringid': '1.collectionobject.guid',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceID'},
            {'fieldname': 'fullName', 'stringid': '1,9-determinations,4.taxon.fullName',
             'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'scientificName'},
            {'fieldname': 'determinedDate', 'stringid': '1,9-determinations.determination.determinedDate',
             'tablelist': '1,9-determinations', 'term': DWC_TERMS_URI + 'dateIdentified'},
            {'fieldname': 'lastName', 'stringid': '1,9-determinations,5.agent.lastName',
             'tablelist': '1,9-determinations,5', 'term': DWC_TERMS_URI + 'identifiedBy'},
            {'fieldname': 'remarks', 'stringid': '1,9-determinations.determination.remarks',
             'tablelist': '1,9-determinations', 'term': DWC_TERMS_URI + 'identificationRemarks'},
            {'fieldname': 'typeStatusName', 'stringid': '1,9-determinations.determination.typeStatusName',
             'tablelist': '1,9-determinations', 'term': DWC_TERMS_URI + 'typeStatus'},
        ],
    },
    {
        'name': 'Audiovisual Core (Default)',
        'fields': [
            {'fieldname': 'guid', 'stringid': '1.collectionobject.guid',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceID'},
            {'fieldname': 'attachmentLocation', 'stringid': '1,111-collectionObjectAttachments,41.attachment.attachmentLocation',
             'tablelist': '1,111-collectionObjectAttachments,41', 'term': AC_TERMS_URI + 'accessURI'},
            {'fieldname': 'mimeType', 'stringid': '1,111-collectionObjectAttachments,41.attachment.mimeType',
             'tablelist': '1,111-collectionObjectAttachments,41', 'term': AC_TERMS_URI + 'format'},
            {'fieldname': 'title', 'stringid': '1,111-collectionObjectAttachments,41.attachment.title',
             'tablelist': '1,111-collectionObjectAttachments,41', 'term': AC_TERMS_URI + 'caption'},
        ],
    },
    {
        'name': 'GGBN Material Sample (Default)',
        'fields': [
            {'fieldname': 'guid', 'stringid': '1.collectionobject.guid',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceID'},
            {'fieldname': 'name', 'stringid': '1,63-preparations,65.preptype.name',
             'tablelist': '1,63-preparations,65', 'term': DWC_TERMS_URI + 'preparations'},
            {'fieldname': 'countAmt', 'stringid': '1.collectionobject.countAmt',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'individualCount'},
        ],
    },
    {
        'name': 'EOL References (Default)',
        'fields': [
            {'fieldname': 'guid', 'stringid': '1.collectionobject.guid',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceID'},
            {'fieldname': 'fullName', 'stringid': '1,9-determinations,4.taxon.fullName',
             'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'scientificName'},
            {'fieldname': 'commonName', 'stringid': '1,9-determinations,4.taxon.commonName',
             'tablelist': '1,9-determinations,4', 'term': DWC_TERMS_URI + 'vernacularName'},
        ],
    },
    {
        'name': 'Resource Relationship (Default)',
        'fields': [
            {'fieldname': 'guid', 'stringid': '1.collectionobject.guid',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'occurrenceID'},
            {'fieldname': 'catalogNumber', 'stringid': '1.collectionobject.catalogNumber',
             'tablelist': '1', 'term': DWC_TERMS_URI + 'catalogNumber'},
        ],
    },
]


def create_default_extension_mappings(collection, user):
    """Create the 5 default Extension mappings."""
    from specifyweb.specify.models import Spquery, Spqueryfield
    from .models import SchemaMapping

    created = []
    for ext_def in DEFAULT_EXTENSION_DEFS:
        name = ext_def['name']
        if SchemaMapping.objects.filter(name=name, isdefault=True).exists():
            continue

        query = Spquery.objects.create(
            name=name,
            contextname='CollectionObject',
            contexttableid=1,
            createdbyagent=user.agents.first() if user else None,
            specifyuser=user,
            isfavorite=False,
        )

        for i, field_def in enumerate(ext_def['fields']):
            Spqueryfield.objects.create(
                query=query,
                fieldname=field_def['fieldname'],
                stringid=field_def['stringid'],
                tablelist=field_def['tablelist'],
                position=i,
                sorttype=0,
                isdisplay=True,
                isnot=False,
                operstart=8,
                startvalue='',
                term=field_def['term'],
            )

        mapping = SchemaMapping.objects.create(
            query=query,
            mappingtype='Extension',
            name=name,
            isdefault=True,
        )
        created.append(mapping)

    return created
