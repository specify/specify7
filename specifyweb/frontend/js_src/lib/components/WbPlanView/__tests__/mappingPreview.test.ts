import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { anyTreeRank, formattedEntry, formatTreeRank } from '../mappingHelpers';
import { generateMappingPathPreview } from '../mappingPreview';

requireContext();

theories(generateMappingPathPreview, [
  [['CollectionObject', ['catalogNumber']], 'Cat #'],
  [['CollectionObject', ['guid']], 'Collection Object - GUID'],
  [['CollectionObject', ['void']], 'Collection Object - Void'],
  [['CollectionObject', ['someNonExistentField']], 'Some Non Existent Field'],
  [['CollectionObject', ['name']], 'Collection Object - Name'],
  [['Geography', ['name']], 'Geography'],
  [['CollectionObject', ['someDnaSequence']], 'Some DNA Sequence'],
  [['CollectionObject', ['accession', 'accessionNumber']], 'Accession #'],
  [
    ['CollectionObject', ['createdByAgent', formattedEntry]],
    'Created By Agent',
  ],
  [
    ['CollectionObject', ['preparations', '#1', 'agent', formattedEntry]],
    'Preparation - Agent',
  ],
  [
    ['CollectionObject', ['determinations', '#1', 'agent', formattedEntry]],
    'Determination - Agent',
  ],
  [
    ['CollectionObject', ['createdByAgent', 'firstName']],
    'Created By - First Name',
  ],
  [
    ['CollectionObject', ['determinations', '#1', 'determiner', 'firstName']],
    'Determiner - First Name',
  ],
  [
    [
      'CollectionObject',
      ['preparations', '#1', 'preparedByAgent', 'firstName'],
    ],
    'Prepared By - First Name',
  ],
  [
    ['CollectionObject', ['dnaSequences', '#1', 'timestampCreated-fullDate']],
    'DNA Sequences - Timestamp Created',
  ],
  [
    ['CollectionObject', ['accession', 'accessionAgents', '#1', 'role']],
    'Accession Agents - Role',
  ],
  [['SpAuditLog', ['modifiedByAgent', formattedEntry]], 'Modified By Agent'],
  [['Agent', ['addresses', formattedEntry]], 'Addresses'],
  [['SpAuditLog', ['fields', formattedEntry]], 'Fields'],
  [['Taxon', [formatTreeRank('Kingdom'), formattedEntry]], 'Kingdom'],
  [['Taxon', [formatTreeRank(anyTreeRank), formattedEntry]], 'Taxon'],
  [['Taxon', [formatTreeRank(anyTreeRank), 'author']], 'Taxon - Author'],
  [['Taxon', [formatTreeRank(anyTreeRank), 'fullName']], 'Taxon - Full Name'],
  [['Taxon', [formatTreeRank('Kingdom'), 'author']], 'Kingdom - Author'],
  [['CollectionObject', []], 'Collection Object'],
  [['CollectionObject', [formattedEntry]], 'Collection Object'],
  [
    [
      'CollectionObject',
      ['accession', 'accessionAgents', '#1', 'agent', 'abbreviation'],
    ],
    'Accession Agents - Abbreviation',
  ],
  [
    [
      'CollectionObject',
      ['accession', 'accessionCitations', '#1', 'referenceWork', 'title'],
    ],
    'Accession Citations - Reference Work - Title',
  ],
  [
    ['CollectionObject', ['cataloger', 'addresses', '#1', 'address']],
    'Cataloger - Address',
  ],
  [
    [
      'CollectionObject',
      ['collectingevent', 'collectors', '#1', 'agent', 'abbreviation'],
    ],
    'Collectors - Abbreviation',
  ],
  [
    ['CollectionObject', ['container', 'storage', '$Building', 'name']],
    'Building',
  ],
  [['Taxon', ['$Kingdom', 'author']], 'Kingdom - Author'],
  [
    [
      'Accession',
      [
        'collectionObjects',
        '#1',
        'collectingEvent',
        'locality',
        'geography',
        '$State',
        'name',
      ],
    ],
    'State',
  ],
  [
    [
      'Accession',
      [
        'collectionObjects',
        '#2',
        'collectingEvent',
        'locality',
        'geography',
        '$State',
        'name',
      ],
    ],
    'State - #2',
  ],
  [
    [
      'Accession',
      [
        'collectionObjects',
        '#99',
        'collectingEvent',
        'locality',
        'geography',
        '$State',
        'remarks',
      ],
    ],
    'State - Remarks - #99',
  ],
  [
    [
      'CollectionObject',
      ['collectionObjectCitations', '#1', 'referenceWork', 'referenceWorkType'],
    ],
    'Collection Object Citations - Reference Work - Type',
  ],
  [
    ['CollectionObject', ['dnaSequences', '#1', 'ambiguousResidues']],
    'DNA Sequences - Ambiguous',
  ],
  [
    [
      'CollectionObject',
      ['exsiccataItems', '#1', 'exsiccata', 'referenceWork', 'title'],
    ],
    'Exsiccata - Reference Work - Title',
  ],
  [['TaxonAttribute', ['taxons', '$Family', 'taxonId']], 'Family - ID'],
]);
