import { generateMappingPathPreview } from '../wbplanviewmappingpreview';
import { runTest } from './testmain';

export function testWbPlanViewTreePreview(): void {
  runTest(
    'WbPlanViewMappingPreview.generateMappingPathPreview',
    [
      [['CollectionObject', ['catalogNumber']], 'Cat #'],
      [['CollectionObject', ['guid']], 'Collection Object GUID'],
      [['CollectionObject', ['void']], 'Collection Object Void'],
      [
        ['CollectionObject', ['someNonExistentField']],
        'Some Non Existent Field',
      ],
      [['CollectionObject', ['name']], 'Collection Object'],
      [['CollectionObject', ['someDnaSequence']], 'Some DNA Sequence'],
      [['CollectionObject', ['accession', 'accessionNumber']], 'Accession #'],
      [
        ['CollectionObject', ['accession', 'accessionAgents', '#1', 'role']],
        'Accession Agents Role',
      ],
      [
        [
          'CollectionObject',
          ['accession', 'accessionAgents', '#1', 'agent', 'abbreviation'],
        ],
        'Accession Agents Abbreviation',
      ],
      [
        [
          'CollectionObject',
          ['accession', 'accessionCitations', '#1', 'referenceWork', 'title'],
        ],
        'Accession Citations Reference Work Title',
      ],
      [
        ['CollectionObject', ['cataloger', 'addresses', '#1', 'address']],
        'Cataloger Address',
      ],
      [
        [
          'CollectionObject',
          ['collectingevent', 'collectors', '#1', 'agent', 'abbreviation'],
        ],
        'Collectors Abbreviation',
      ],
      [
        ['CollectionObject', ['container', 'storage', '$Building', 'name']],
        'Building',
      ],
      [['Taxon', ['$Kingdom', 'author']], 'Kingdom Author'],
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
        'State #2',
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
        'State Remarks #99',
      ],
      [
        [
          'CollectionObject',
          [
            'collectionObjectCitations',
            '#1',
            'referenceWork',
            'referenceWorkType',
          ],
        ],
        'Collection Object Citations Reference Work Type',
      ],
      [
        ['CollectionObject', ['dnaSequences', '#1', 'ambiguousResidues']],
        'DNA Sequences Ambiguous',
      ],
      [
        [
          'CollectionObject',
          ['exsiccataItems', '#1', 'exsiccata', 'referenceWork', 'title'],
        ],
        'Exsiccata Reference Work Title',
      ],
      [['TaxonAttribute', ['taxons', '$Family', 'taxonId']], 'Family ID'],
    ],
    generateMappingPathPreview
  );
}
