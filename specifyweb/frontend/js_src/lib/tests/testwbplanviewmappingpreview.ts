import { runTest } from './testmain';
import { generateMappingPathPreview } from '../wbplanviewmappingpreview';

export default function (): void {
  runTest(
    'WbPlanViewMappingPreview.generateMappingPathPreview',
    [
      [['CollectionObject', ['catalognumber']], 'Catalog Number'],
      [['CollectionObject', ['guid']], 'Collection Object GUID'],
      [['CollectionObject', ['void']], 'Collection Object Void'],
      [
        ['CollectionObject', ['someNonExistentField']],
        'Some Non Existent Field',
      ],
      [['CollectionObject', ['name']], 'Collection Object'],
      [['CollectionObject', ['someDnaSequence']], 'Some DNA Sequence'],
      [
        ['CollectionObject', ['accession', 'accessionnumber']],
        'Accession Number',
      ],
      [
        ['CollectionObject', ['accession', 'accessionagents', '#1', 'role']],
        'Accession Agents Role',
      ],
      [
        [
          'CollectionObject',
          ['accession', 'accessionagents', '#1', 'agent', 'abbreviation'],
        ],
        'Accession Agents Abbreviation',
      ],
      [
        [
          'CollectionObject',
          ['accession', 'accessioncitations', '#1', 'referencework', 'title'],
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
            'collectionobjects',
            '#1',
            'collectingevent',
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
            'collectionobjects',
            '#2',
            'collectingevent',
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
            'collectionobjects',
            '#99',
            'collectingevent',
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
            'collectionobjectcitations',
            '#1',
            'referencework',
            'referenceworktype',
          ],
        ],
        'Collection Object Citations Reference Work Type',
      ],
      [
        ['CollectionObject', ['dnasequences', '#1', 'ambiguousresidues']],
        'DNA Sequences Ambiguous',
      ],
      [
        [
          'CollectionObject',
          ['exsiccataitems', '#1', 'exsiccata', 'referencework', 'title'],
        ],
        'Exsiccata Reference Work Title',
      ],
    ],
    generateMappingPathPreview
  );
}
