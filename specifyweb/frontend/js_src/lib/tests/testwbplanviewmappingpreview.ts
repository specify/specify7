import * as WbPlanViewMappingPreview from '../wbplanviewmappingpreview';
import { runTest } from './testmain';

export default function (): void {
  runTest(
    'WbPlanViewMappingPreview.generateMappingPathPreview',
    [
      [['collectionobject', ['catalognumber']], 'Catalog Number'],
      [['collectionobject', ['guid']], 'Collection Object GUID'],
      [['collectionobject', ['void']], 'Collection Object Void'],
      [
        ['collectionobject', ['someNonExistentField']],
        'Some Non Existent Field',
      ],
      [['collectionobject', ['name']], 'Collection Object'],
      [['collectionobject', ['someDnaSequence']], 'Some DNA Sequence'],
      [
        ['collectionobject', ['accession', 'accessionnumber']],
        'Accession Number',
      ],
      [
        ['collectionobject', ['accession', 'accessionagents', '#1', 'role']],
        'Accession Agents Role',
      ],
      [
        [
          'collectionobject',
          ['accession', 'accessionagents', '#1', 'agent', 'abbreviation'],
        ],
        'Accession Agents Abbreviation',
      ],
      [
        [
          'collectionobject',
          ['accession', 'accessioncitations', '#1', 'referencework', 'title'],
        ],
        'Accession Citations Reference Work Title',
      ],
      [
        ['collectionobject', ['cataloger', 'addresses', '#1', 'address']],
        'Cataloger Address',
      ],
      [
        [
          'collectionobject',
          ['collectingevent', 'collectors', '#1', 'agent', 'abbreviation'],
        ],
        'Collectors Abbreviation',
      ],
      [
        ['collectionobject', ['container', 'storage', '$Building', 'name']],
        'Building',
      ],
      [['taxon', ['$Kingdom', 'author']], 'Kingdom Author'],
      [
        [
          'accession',
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
          'accession',
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
          'accession',
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
          'collectionobject',
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
        ['collectionobject', ['dnasequences', '#1', 'ambiguousresidues']],
        'DNA Sequences Ambiguous',
      ],
      [
        [
          'collectionobject',
          ['exsiccataitems', '#1', 'exsiccata', 'referencework', 'title'],
        ],
        'Exsiccata Reference Work Title',
      ],
    ],
    WbPlanViewMappingPreview.generateMappingPathPreview
  );
}
