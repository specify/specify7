TABLE_TO_COLLECTION_FILTER_QUERIES = {
    'Accession': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'AccessionAgent': {
        'field_paths': [
            ['accession', 'division'],
        ],
        'filter_query': [
            ('accession__division', 'collection.discipline.division'),
        ],
    },
    'AccessionAttachment': {
        'field_paths': [
            ['accession', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('accession__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AccessionAuthorization': {
        'field_paths': [
            ['accession', 'division'],
        ],
        'filter_query': [
            ('accession__division', 'collection.discipline.division'),
        ],
    },
    'AccessionCitation': {
        'field_paths': [
            ['accession', 'division'],
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('accession__division', 'collection.discipline.division'),
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'Address': {
        'field_paths': [
            ['divisions'],
        ],
        'filter_query': [
            ('divisions', 'collection.discipline.division'),
        ],
    },
    'AddressOfRecord': {
        'field_paths': [
            ['accessions', 'division'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('accessions__division', 'collection.discipline.division'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Agent': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'AgentAttachment': {
        'field_paths': [
            ['agent', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AgentGeography': {
        'field_paths': [
            ['agent', 'division'],
            ['geography', 'definition', 'disciplines'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
            ('geography__definition__disciplines', 'collection.discipline'),
        ],
    },
    'AgentIdentifier': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'AgentSpecialty': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'AgentVariant': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Appraisal': {
        'field_paths': [
            ['collectionobjects', 'collection'],
            ['accession', 'division'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('collectionobjects__collection', 'collection'),
            ('accession__division', 'collection.discipline.division'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Attachment': {
        'field_paths': [
            ['base_attachment'],
        ],
        'filter_query': [
            ('scopetype', None),
            ('scopetype', 10),
            ('scopetype', 0),
            ('scopeid', 'collection.id'),
            ('scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AttachmentImageAttribute': {
        'field_paths': [
            ['attachments'],
        ],
        'filter_query': [
            ('attachments__scopetype', None),
            ('attachments__scopetype', 10),
            ('attachments__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachments__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachments__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachments__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AttachmentMetadata': {
        'field_paths': [
            ['attachment'],
        ],
        'filter_query': [
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AttachmentTag': {
        'field_paths': [
            ['attachment'],
        ],
        'filter_query': [
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'AttributeDef': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'Author': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'AutoNumberingScheme': {
        'field_paths': [
            ['collections'],
            ['divisions'],
            ['disciplines'],
        ],
        'filter_query': [
            ('collections', 'collection'),
            ('divisions', 'collection.discipline.division'),
            ('disciplines', 'collection.discipline'),
        ],
    },
    'Borrow': {
        'field_paths': [
            ['borrowagents', 'agent', 'division'],
        ],
        'filter_query': [
            ('borrowagents__agent__division', 'collection.discipline.division'),
        ],
    },
    'BorrowAgent': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'BorrowAttachment': {
        'field_paths': [
            ['borrow', 'borrowagents', 'agent', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('borrow__borrowagents__agent__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'BorrowMaterial': {
        'field_paths': [
            ['borrow', 'borrowagents', 'agent', 'division'],
        ],
        'filter_query': [
            ('borrow__borrowagents__agent__division', 'collection.discipline.division'),
        ],
    },
    'BorrowReturnMaterial': {
        'field_paths': [
            ['borrowmaterial', 'borrow', 'borrowagents', 'agent', 'division'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('borrowmaterial__borrow__borrowagents__agent__division', 'collection.discipline.division'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'CollectingEvent': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'CollectingEventAttachment': {
        'field_paths': [
            ['collectingevent', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('collectingevent__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'CollectingEventAttr': {
        'field_paths': [
            ['collectingevent', 'discipline'],
            ['definition', 'discipline'],
        ],
        'filter_query': [
            ('collectingevent__discipline', 'collection.discipline'),
            ('definition__discipline', 'collection.discipline'),
        ],
    },
    'CollectingEventAttribute': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'CollectingEventAuthorization': {
        'field_paths': [
            ['collectingevent', 'discipline'],
            ['permit', 'institution'],
        ],
        'filter_query': [
            ('collectingevent__discipline', 'collection.discipline'),
            ('permit__institution', 'collection.discipline.division.institution'),
        ],
    },
    'CollectingTrip': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'CollectingTripAttachment': {
        'field_paths': [
            ['collectingtrip', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('collectingtrip__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'CollectingTripAttribute': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'CollectingTripAuthorization': {
        'field_paths': [
            ['collectingtrip', 'discipline'],
            ['permit', 'institution'],
        ],
        'filter_query': [
            ('collectingtrip__discipline', 'collection.discipline'),
            ('permit__institution', 'collection.discipline.division.institution'),
        ],
    },
    'Collection': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'CollectionObject': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'CollectionObjectAttachment': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'CollectionObjectAttr': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'CollectionObjectAttribute': {
        'field_paths': [
            ['collectionobjects', 'collection'],
            ['agent1', 'division'],
        ],
        'filter_query': [
            ('collectionobjects__collection', 'collection'),
            ('agent1__division', 'collection.discipline.division'),
        ],
    },
    'CollectionObjectCitation': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'CollectionObjectProperty': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'CollectionRelType': {
        'field_paths': [
            ['leftsidecollection', 'discipline'],
            ['rightsidecollection', 'discipline'],
        ],
        'filter_query': [
            ('leftsidecollection__discipline', 'collection.discipline'),
            ('rightsidecollection__discipline', 'collection.discipline'),
        ],
    },
    'CollectionRelationship': {
        'field_paths': [
            ['leftside', 'collection'],
            ['rightside', 'collection'],
        ],
        'filter_query': [
            ('leftside__collection', 'collection'),
            ('rightside__collection', 'collection'),
        ],
    },
    'Collector': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'CommonNameTx': {
        'field_paths': [
            ['taxon', 'definition', 'discipline'],
            ['citations', 'referencework', 'institution'],
        ],
        'filter_query': [
            ('taxon__definition__discipline', 'collection.discipline'),
            ('citations__referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'CommonNameTxCitation': {
        'field_paths': [
            ['commonnametx', 'taxon', 'definition', 'discipline'],
            ['commonnametx', 'citations', 'referencework', 'institution'],
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('commonnametx__taxon__definition__discipline', 'collection.discipline'),
            ('commonnametx__citations__referencework__institution', 'collection.discipline.division.institution'),
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'ConservDescription': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'ConservDescriptionAttachment': {
        'field_paths': [
            ['attachment'],
            ['conservdescription', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
            ('conservdescription__collectionobject__collection', 'collection'),
        ],
    },
    'ConservEvent': {
        'field_paths': [
            ['conservdescription', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('conservdescription__collectionobject__collection', 'collection'),
        ],
    },
    'ConservEventAttachment': {
        'field_paths': [
            ['attachment'],
            ['conservevent', 'conservdescription', 'collectionobject'],
        ],
        'filter_query': [
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
            ('conservevent__conservdescription__collectionobject', 'collection'),
        ],
    },
    'Container': {
        'field_paths': [
            ['storage', 'definition', 'institutions'],
        ],
        'filter_query': [
            ('storage__definition__institutions', 'collection.discipline.division.institution'),
        ],
    },
    'DNAPrimer': {
        'field_paths': [
            ['dnasequencingruns', 'dnasequence', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('dnasequencingruns__dnasequence__collectionobject__collection', 'collection'),
        ],
    },
    'DNASequence': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'DNASequenceAttachment': {
        'field_paths': [
            ['dnasequence', 'collectionobject', 'collection'],
            ['attachment'],
        ],
        'filter_query': [
            ('dnasequence__collectionobject__collection', 'collection'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'DNASequencingRun': {
        'field_paths': [
            ['dnasequence', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('dnasequence__collectionobject__collection', 'collection'),
        ],
    },
    'DNASequencingRunAttachment': {
        'field_paths': [
            ['dnasequencingrun', 'dnasequence', 'collectionobject', 'collection'],
            ['attachment'],
        ],
        'filter_query': [
            ('dnasequencingrun__dnasequence__collectionobject__collection', 'collection'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'DNASequencingRunCitation': {
        'field_paths': [
            ['sequencingrun', 'dnasequence', 'collectionobject', 'collection'],
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('sequencingrun__dnasequence__collectionobject__collection', 'collection'),
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'DataType': None,
    'Deaccession': {
        'field_paths': [
            ['agent1', 'division'],
            ['agent2', 'division'],
            ['exchangeouts', 'division'],
        ],
        'filter_query': [
            ('agent1__division', 'collection.discipline.division'),
            ('agent2__division', 'collection.discipline.division'),
            ('exchangeouts__division', 'collection.discipline.division'),
        ],
    },
    'DeaccessionAgent': {
        'field_paths': [
            ['agent', 'division'],
            ['deaccession', 'agent1', 'division'],
            ['deaccession', 'agent2', 'division'],
            ['deaccession', 'exchangeouts', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
            ('deaccession__agent1__division', 'collection.discipline.division'),
            ('deaccession__agent2__division', 'collection.discipline.division'),
            ('deaccession__exchangeouts__division', 'collection.discipline.division'),
        ],
    },
    'DeaccessionAttachment': {
        'field_paths': [
            ['attachment'],
            ['deaccession', 'agent1', 'division'],
            ['deaccession', 'agent2', 'division'],
            ['deaccession', 'exchangeouts', 'division'],
        ],
        'filter_query': [
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
            ('deaccession__agent1__division', 'collection.discipline.division'),
            ('deaccession__agent2__division', 'collection.discipline.division'),
            ('deaccession__exchangeouts__division', 'collection.discipline.division'),
        ],
    },
    'Determination': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'DeterminationCitation': {
        'field_paths': [
            ['determination', 'collectionobject', 'collection'],
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('determination__collectionobject__collection', 'collection'),
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'Determiner': {
        'field_paths': [
            ['determination', 'collectionobject', 'collection'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('determination__collectionobject__collection', 'collection'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Discipline': {
        'field_paths': [
            ['usergroupscopeid'],
        ],
        'filter_query': [
            ('usergroupscopeid', 'collection.discipline.usergroupscopeid'),
        ],
    },
    'Disposal': {
        'field_paths': [
            ['deaccession', 'agent1', 'division'],
            ['deaccession', 'agent2', 'division'],
            ['deaccession', 'exchangeouts', 'division'],
        ],
        'filter_query': [
            ('deaccession__agent1__division', 'collection.discipline.division'),
            ('deaccession__agent2__division', 'collection.discipline.division'),
            ('deaccession__exchangeouts__division', 'collection.discipline.division'),
        ],
    },
    'DisposalAgent': {
        'field_paths': [
            ['disposal', 'deaccession', 'agent1', 'division'],
            ['disposal', 'deaccession', 'agent2', 'division'],
            ['disposal', 'deaccession', 'exchangeouts', 'division'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('disposal__deaccession__agent1__division', 'collection.discipline.division'),
            ('disposal__deaccession__agent2__division', 'collection.discipline.division'),
            ('disposal__deaccession__exchangeouts__division', 'collection.discipline.division'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'DisposalAttachment': {
        'field_paths': [
            ['disposal', 'deaccession', 'agent1', 'division'],
            ['disposal', 'deaccession', 'agent2', 'division'],
            ['disposal', 'deaccession', 'exchangeouts', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('disposal__deaccession__agent1__division', 'collection.discipline.division'),
            ('disposal__deaccession__agent2__division', 'collection.discipline.division'),
            ('disposal__deaccession__exchangeouts__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'DisposalPreparation': {
        'field_paths': [
            ['disposal', 'deaccession', 'agent1', 'division'],
            ['disposal', 'deaccession', 'agent2', 'division'],
            ['disposal', 'deaccession', 'exchangeouts', 'division'],
            ['preparation', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('disposal__deaccession__agent1__division', 'collection.discipline.division'),
            ('disposal__deaccession__agent2__division', 'collection.discipline.division'),
            ('disposal__deaccession__exchangeouts__division', 'collection.discipline.division'),
            ('preparation__collectionobject__collection', 'collection'),
        ],
    },
    'Division': {
        'field_paths': [
            ['usergroupscopeid'],
        ],
        'filter_query': [
            ('usergroupscopeid', 'collection.discipline.division.usergroupscopeid'),
        ],
    },
    'ExchangeIn': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'ExchangeInAttachment': {
        'field_paths': [
            ['exchangein', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('exchangein__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'ExchangeInPrep': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'ExchangeOut': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'ExchangeOutAttachment': {
        'field_paths': [
            ['exchangeout', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('exchangeout__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'ExchangeOutPrep': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'Exsiccata': {
        'field_paths': [
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'ExsiccataItem': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'Extractor': {
        'field_paths': [
            ['dnasequence', 'collectionobject', 'collection'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('dnasequence__collectionobject__collection', 'collection'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'FieldNotebook': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'FieldNotebookAttachment': {
        'field_paths': [
            ['fieldnotebook', 'collection'],
            ['attachment'],
        ],
        'filter_query': [
            ('fieldnotebook__collection', 'collection'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'FieldNotebookPage': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'FieldNotebookPageAttachment': {
        'field_paths': [
            ['fieldnotebookpage', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('fieldnotebookpage__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'FieldNotebookPageSet': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'FieldNotebookPageSetAttachment': {
        'field_paths': [
            ['fieldnotebookpageset', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('fieldnotebookpageset__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'FundingAgent': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'GeoCoordDetail': {
        'field_paths': [
            ['locality', 'discipline'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
        ],
    },
    'Geography': {
        'field_paths': [
            ['definition', 'disciplines'],
        ],
        'filter_query': [
            ('definition__disciplines', 'collection.discipline'),
        ],
    },
    'GeographyTreeDef': {
        'field_paths': [
            ['disciplines'],
        ],
        'filter_query': [
            ('disciplines', 'collection.discipline'),
        ],
    },
    'GeographyTreeDefItem': {
        'field_paths': [
            ['treedef', 'disciplines'],
        ],
        'filter_query': [
            ('treedef__disciplines', 'collection.discipline'),
        ],
    },
    'GeologicTimePeriod': {
        'field_paths': [
            ['definition', 'disciplines'],
        ],
        'filter_query': [
            ('definition__disciplines', 'collection.discipline'),
        ],
    },
    'GeologicTimePeriodTreeDef': {
        'field_paths': [
            ['disciplines'],
        ],
        'filter_query': [
            ('disciplines', 'collection.discipline'),
        ],
    },
    'GeologicTimePeriodTreeDefItem': {
        'field_paths': [
            ['treedef', 'disciplines'],
        ],
        'filter_query': [
            ('treedef__disciplines', 'collection.discipline'),
        ],
    },
    'Gift': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'GiftAgent': {
        'field_paths': [
            ['gift', 'discipline'],
        ],
        'filter_query': [
            ('gift__discipline', 'collection.discipline'),
        ],
    },
    'GiftAttachment': {
        'field_paths': [
            ['gift', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('gift__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'GiftPreparation': {
        'field_paths': [
            ['gift', 'discipline'],
        ],
        'filter_query': [
            ('gift__discipline', 'collection.discipline'),
        ],
    },
    'GroupPerson': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'InfoRequest': {
        'field_paths': [
            ['agent', 'division'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Institution': {
        'field_paths': [
            ['usergroupscopeid'],
        ],
        'filter_query': [
            ('usergroupscopeid', 'collection.discipline.division.institution.usergroupscopeid'),
        ],
    },
    'InstitutionNetwork': {
        'field_paths': [
            ['collections'],
        ],
        'filter_query': [
            ('collections', 'collection'),
        ],
    },
    'Journal': {
        'field_paths': [
            ['institution'],
        ],
        'filter_query': [
            ('institution', 'collection.discipline.division.institution'),
        ],
    },
    'LatLonPolygon': {
        'field_paths': [
            ['locality', 'discipline'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
        ],
    },
    'LatLonPolygonPnt': {
        'field_paths': [
            ['latlonpolygon', 'locality', 'discipline'],
        ],
        'filter_query': [
            ('latlonpolygon__locality__discipline', 'collection.discipline'),
        ],
    },
    'LithoStrat': {
        'field_paths': [
            ['definition', 'disciplines'],
        ],
        'filter_query': [
            ('definition__disciplines', 'collection.discipline'),
        ],
    },
    'LithoStratTreeDef': {
        'field_paths': [
            ['disciplines'],
        ],
        'filter_query': [
            ('disciplines', 'collection.discipline'),
        ],
    },
    'LithoStratTreeDefItem': {
        'field_paths': [
            ['treedef', 'disciplines'],
        ],
        'filter_query': [
            ('treedef__disciplines', 'collection.discipline'),
        ],
    },
    'Loan': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'LoanAgent': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'LoanAttachment': {
        'field_paths': [
            ['loan', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('loan__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'LoanPreparation': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'LoanReturnPreparation': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'Locality': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'LocalityAttachment': {
        'field_paths': [
            ['locality', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'LocalityCitation': {
        'field_paths': [
            ['locality', 'discipline'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
        ],
    },
    'LocalityDetail': {
        'field_paths': [
            ['locality', 'discipline'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
        ],
    },
    'LocalityNameAlias': {
        'field_paths': [
            ['locality', 'discipline'],
        ],
        'filter_query': [
            ('locality__discipline', 'collection.discipline'),
        ],
    },
    'MaterialSample': {
        'field_paths': [
            ['preparation', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('preparation__collectionobject__collection', 'collection'),
        ],
    },
    'MorphBankView': None,
    'OtherIdentifier': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'PaleoContext': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'PcrPerson': {
        'field_paths': [
            ['dnasequence', 'collectionobject', 'collection'],
            ['agent', 'division'],
        ],
        'filter_query': [
            ('dnasequence__collectionobject__collection', 'collection'),
            ('agent__division', 'collection.discipline.division'),
        ],
    },
    'Permit': {
        'field_paths': [
            ['institution'],
        ],
        'filter_query': [
            ('institution', 'collection.discipline.division.institution'),
        ],
    },
    'PermitAttachment': {
        'field_paths': [
            ['permit', 'institution'],
            ['attachment'],
        ],
        'filter_query': [
            ('permit__institution', 'collection.discipline.division.institution'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'PickList': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'PickListItem': {
        'field_paths': [
            ['picklist', 'collection'],
        ],
        'filter_query': [
            ('picklist__collection', 'collection'),
        ],
    },
    'PrepType': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'Preparation': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'PreparationAttachment': {
        'field_paths': [
            ['preparation', 'collectionobject', 'collection'],
            ['attachment'],
        ],
        'filter_query': [
            ('preparation__collectionobject__collection', 'collection'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'PreparationAttr': {
        'field_paths': [
            ['preparation', 'collectionobject', 'collection'],
            ['definition', 'discipline'],
        ],
        'filter_query': [
            ('preparation__collectionobject__collection', 'collection'),
            ('definition__discipline', 'collection.discipline'),
        ],
    },
    'PreparationAttribute': {
        'field_paths': [
            ['preparations', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('preparations__collectionobject__collection', 'collection'),
        ],
    },
    'PreparationProperty': {
        'field_paths': [
            ['preparation', 'collectionobject', 'collection'],
        ],
        'filter_query': [
            ('preparation__collectionobject__collection', 'collection'),
        ],
    },
    'Project': {
        'field_paths': [
            ['agent', 'division'],
            ['collectionobjects', 'collection'],
        ],
        'filter_query': [
            ('agent__division', 'collection.discipline.division'),
            ('collectionobjects__collection', 'collection'),
        ],
    },
    'RecordSet': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'RecordSetItem': {
        'field_paths': [
            ['recordset', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('recordset__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'ReferenceWork': {
        'field_paths': [
            ['institution'],
        ],
        'filter_query': [
            ('institution', 'collection.discipline.division.institution'),
        ],
    },
    'ReferenceWorkAttachment': {
        'field_paths': [
            ['referencework', 'institution'],
            ['attachment'],
        ],
        'filter_query': [
            ('referencework__institution', 'collection.discipline.division.institution'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'RepositoryAgreement': {
        'field_paths': [
            ['division'],
        ],
        'filter_query': [
            ('division', 'collection.discipline.division'),
        ],
    },
    'RepositoryAgreementAttachment': {
        'field_paths': [
            ['repositoryagreement', 'division'],
            ['attachment'],
        ],
        'filter_query': [
            ('repositoryagreement__division', 'collection.discipline.division'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'Shipment': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'SpAppResource': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'SpAppResourceData': {
        'field_paths': [
            ['spappresource', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('spappresource__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'SpAppResourceDir': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'SpAuditLog': None,
    'SpAuditLogField': None,
    'SpExportSchema': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'SpExportSchemaItem': {
        'field_paths': [
            ['spexportschema', 'discipline'],
        ],
        'filter_query': [
            ('spexportschema__discipline', 'collection.discipline'),
        ],
    },
    'SpExportSchemaItemMapping': {
        'field_paths': [
            ['exportschemaitem', 'spexportschema', 'discipline'],
        ],
        'filter_query': [
            ('exportschemaitem__spexportschema__discipline', 'collection.discipline'),
        ],
    },
    'SpExportSchemaMapping': {
        'field_paths': [
            ['spexportschemas', 'discipline'],
        ],
        'filter_query': [
            ('spexportschemas__discipline', 'collection.discipline'),
        ],
    },
    'SpFieldValueDefault': None,
    'SpLocaleContainer': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'SpLocaleContainerItem': {
        'field_paths': [
            ['container', 'discipline'],
        ],
        'filter_query': [
            ('container__discipline', 'collection.discipline'),
        ],
    },
    'SpLocaleItemStr': {
        'field_paths': [
            ['containername', 'discipline'],
        ],
        'filter_query': [
            ('containername__discipline', 'collection.discipline'),
        ],
    },
    'SpPermission': None,
    'SpPrincipal': None,
    'SpQuery': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'SpQueryField': {
        'field_paths': [
        ],
        'filter_query': [
        ],
    },
    'SpReport': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
            ['appresource', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
            ('appresource__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'SpSymbiotaInstance': {
        'field_paths': [
            ['schemamapping', 'spexportschemas', 'discipline'],
        ],
        'filter_query': [
            ('schemamapping__spexportschemas__discipline', 'collection.discipline'),
        ],
    },
    'SpTaskSemaphore': {
        'field_paths': [
            ['collection'],
        ],
        'filter_query': [
            ('collection', 'collection'),
        ],
    },
    'SpVersion': None,
    'SpViewSetObj': {
        'field_paths': [
            ['spappresourcedir', 'collection'],
        ],
        'filter_query': [
            ('spappresourcedir__collection', 'collection'),
        ],
    },
    'SpVisualQuery': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'SpecifyUser': {
        'field_paths': [
            ['agents', 'division'],
        ],
        'filter_query': [
            ('agents__division', 'collection.discipline.division'),
        ],
    },
    'Storage': {
        'field_paths': [
            ['definition', 'institutions'],
        ],
        'filter_query': [
            ('definition__institutions', 'collection.discipline.division.institution'),
        ],
    },
    'StorageAttachment': {
        'field_paths': [
            ['storage', 'definition', 'institutions'],
            ['attachment'],
        ],
        'filter_query': [
            ('storage__definition__institutions', 'collection.discipline.division.institution'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'StorageTreeDef': {
        'field_paths': [
            ['institutions'],
        ],
        'filter_query': [
            ('institutions', 'collection.discipline.division.institution'),
        ],
    },
    'StorageTreeDefItem': {
        'field_paths': [
            ['treedef', 'institutions'],
        ],
        'filter_query': [
            ('treedef__institutions', 'collection.discipline.division.institution'),
        ],
    },
    'Taxon': {
        'field_paths': [
            ['definition', 'discipline'],
        ],
        'filter_query': [
            ('definition__discipline', 'collection.discipline'),
        ],
    },
    'TaxonAttachment': {
        'field_paths': [
            ['taxon', 'definition', 'discipline'],
            ['attachment'],
        ],
        'filter_query': [
            ('taxon__definition__discipline', 'collection.discipline'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'TaxonAttribute': {
        'field_paths': [
            ['agent1', 'division'],
            ['taxons', 'definition', 'discipline'],
        ],
        'filter_query': [
            ('agent1__division', 'collection.discipline.division'),
            ('taxons__definition__discipline', 'collection.discipline'),
        ],
    },
    'TaxonCitation': {
        'field_paths': [
            ['taxon', 'definition', 'discipline'],
            ['referencework', 'institution'],
        ],
        'filter_query': [
            ('taxon__definition__discipline', 'collection.discipline'),
            ('referencework__institution', 'collection.discipline.division.institution'),
        ],
    },
    'TaxonTreeDef': {
        'field_paths': [
            ['discipline'],
        ],
        'filter_query': [
            ('discipline', 'collection.discipline'),
        ],
    },
    'TaxonTreeDefItem': {
        'field_paths': [
            ['treedef', 'discipline'],
        ],
        'filter_query': [
            ('treedef__discipline', 'collection.discipline'),
        ],
    },
    'TreatmentEvent': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'TreatmentEventAttachment': {
        'field_paths': [
            ['treatmentevent', 'collectionobject', 'collection'],
            ['attachment'],
        ],
        'filter_query': [
            ('treatmentevent__collectionobject__collection', 'collection'),
            ('attachment__scopetype', None),
            ('attachment__scopetype', 10),
            ('attachment__scopetype', 0),
            ('scopeid', 'collection.id'),
            ('attachment__scopetype', 1),
            ('scopeid', 'collection.discipline.id'),
            ('attachment__scopetype', 2),
            ('scopeid', 'collection.discipline.division.id'),
            ('attachment__scopetype', 3),
            ('scopeid', 'collection.discipline.division.institution.id'),
        ],
    },
    'VoucherRelationship': {
        'field_paths': [
            ['collectionobject', 'collection'],
        ],
        'filter_query': [
            ('collectionobject__collection', 'collection'),
        ],
    },
    'Workbench': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchDataItem': {
        'field_paths': [
            ['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('workbenchrow__workbench__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchRow': {
        'field_paths': [
            ['workbench', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('workbench__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchRowExportedRelationship': {
        'field_paths': [
            ['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('workbenchrow__workbench__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchRowImage': {
        'field_paths': [
            ['workbenchrow', 'workbench', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('workbenchrow__workbench__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchTemplate': {
        'field_paths': [
            ['specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('specifyuser__agents__division', 'collection.discipline.division'),
        ],
    },
    'WorkbenchTemplateMappingItem': {
        'field_paths': [
            ['workbenchtemplate', 'specifyuser', 'agents', 'division'],
        ],
        'filter_query': [
            ('workbenchtemplate__specifyuser__agents__division', 'collection.discipline.division'),
        ],
    }
}