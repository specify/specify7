import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import type { RA } from '../../../utils/types';
import type { AutoMapperResults } from '../autoMapper';
import {
  type AutoMapperConstructorParameters,
  AutoMapper as AutoMapperConstructor,
  circularTables,
} from '../autoMapper';

requireContext();

theories(
  function AutoMapper(
    parameters: AutoMapperConstructorParameters
  ): AutoMapperResults {
    return new AutoMapperConstructor(parameters).map();
  },
  [
    {
      in: [
        {
          getMappedFields: (): RA<string> => [],
          headers: [
            'BMSM No.',
            'Class',
            'Superfamily',
            'Family',
            'Genus',
            'Subgenus',
            'Species',
            'Subspecies',
            'Species Author',
            'Subspecies Author',
            'Who ID First Name',
            'Determiner 1 Title',
            'Determiner 1 First Name',
            'Determiner 1 Middle Initial',
            'Determiner 1 Last Name',
            'Determination Date Verbatim',
            'Determination Date',
            'Determination Status',
            'Country',
            'State/Prov/Pref',
            'Region',
            'Site',
            'Sea Basin',
            'Continent/Ocean',
            'Date Collected',
            'Start Date Collected',
            'End Date Collected',
            'Collection Method',
            'Verbatim Collecting method',
            'No. of Specimens',
            'Live?',
            'W/Operc',
            'Lot Description',
            'Prep Type 1',
            '- Paired valves',
            'for bivalves - Single valves',
            'Habitat',
            'Min Depth (M)',
            'Max Depth (M)',
            'Fossil?',
            'Stratum',
            'Sex / Age',
            'Lot Status',
            'Accession No.',
            'Original Label',
            'Remarks',
            'Processed by',
            'Cataloged by',
            'DateCataloged',
            'Latitude1',
            'Latitude2',
            'Longitude1',
            'Longitude2',
            'Lat Long Type',
            'Station No.',
            'Checked by',
            'Label Printed',
            'Not for publication on Web',
            'Realm',
            'Estimated',
            'Collected Verbatim',
            'Collector 1 Title',
            'Collector 1 First Name',
            'Collector 1 Middle Initial',
            'Collector 1 Last Name',
            'Collector 2 Title',
            'Collector 2 First Name',
            'Collector 2 Middle Initial',
            'Collector 2 Last name',
            'Collector 3 Title',
            'Collector 3 First Name',
            'Collector 3 Middle Initial',
            'Collector 3 Last Name',
            'Collector 4 Title',
            'Collector 4 First Name',
            'Collector 4 Middle Initial',
            'Collector 4 Last Name',
          ],
          baseTableName: 'CollectionObject',
          scope: 'autoMapper',
        },
      ],
      out: {
        'Cataloged by': [['cataloger', 'lastName']],
        'Date Collected': [['collectingEvent', 'startDate']],
        'Collection Method': [['collectingEvent', 'method']],
        'Determination Date': [['determinations', '#1', 'determinedDate']],
        'Determination Status': [['determinations', '#1', 'typeStatusName']],
        'Max Depth (M)': [['collectingEvent', 'locality', 'maxElevation']],
        'Min Depth (M)': [['collectingEvent', 'locality', 'minElevation']],
        'Who ID First Name': [
          ['determinations', '#1', 'determiner', 'firstName'],
        ],
        'Determiner 1 First Name': [
          ['determinations', '#2', 'determiner', 'firstName'],
        ],
        'Determiner 1 Last Name': [
          ['determinations', '#1', 'determiner', 'lastName'],
        ],
        'Determiner 1 Middle Initial': [
          ['determinations', '#1', 'determiner', 'middleInitial'],
        ],
        'Determiner 1 Title': [['determinations', '#1', 'determiner', 'title']],
        'Collector 1 First Name': [
          ['collectingEvent', 'collectors', '#1', 'agent', 'firstName'],
        ],
        'Collector 2 First Name': [
          ['collectingEvent', 'collectors', '#2', 'agent', 'firstName'],
        ],
        'Collector 3 First Name': [
          ['collectingEvent', 'collectors', '#3', 'agent', 'firstName'],
        ],
        'Collector 4 First Name': [
          ['collectingEvent', 'collectors', '#4', 'agent', 'firstName'],
        ],
        'Collector 1 Last Name': [
          ['collectingEvent', 'collectors', '#1', 'agent', 'lastName'],
        ],
        'Collector 2 Last name': [
          ['collectingEvent', 'collectors', '#2', 'agent', 'lastName'],
        ],
        'Collector 3 Last Name': [
          ['collectingEvent', 'collectors', '#3', 'agent', 'lastName'],
        ],
        'Collector 4 Last Name': [
          ['collectingEvent', 'collectors', '#4', 'agent', 'lastName'],
        ],
        'Collector 1 Middle Initial': [
          ['collectingEvent', 'collectors', '#1', 'agent', 'middleInitial'],
        ],
        'Collector 2 Middle Initial': [
          ['collectingEvent', 'collectors', '#2', 'agent', 'middleInitial'],
        ],
        'Collector 3 Middle Initial': [
          ['collectingEvent', 'collectors', '#3', 'agent', 'middleInitial'],
        ],
        'Collector 4 Middle Initial': [
          ['collectingEvent', 'collectors', '#4', 'agent', 'middleInitial'],
        ],
        'Collector 1 Title': [
          ['collectingEvent', 'collectors', '#1', 'agent', 'title'],
        ],
        'Collector 2 Title': [
          ['collectingEvent', 'collectors', '#2', 'agent', 'title'],
        ],
        'Collector 3 Title': [
          ['collectingEvent', 'collectors', '#3', 'agent', 'title'],
        ],
        'Collector 4 Title': [
          ['collectingEvent', 'collectors', '#4', 'agent', 'title'],
        ],
        'Accession No.': [['accession', 'accessionNumber']],
        'Lat Long Type': [['collectingEvent', 'locality', 'latLongType']],
        Latitude1: [['collectingEvent', 'locality', 'latitude1']],
        Latitude2: [['collectingEvent', 'locality', 'latitude2']],
        Longitude1: [['collectingEvent', 'locality', 'longitude1']],
        Longitude2: [['collectingEvent', 'locality', 'longitude2']],
        Class: [['determinations', '#1', 'taxon', '$Class', 'name']],
        Family: [['determinations', '#1', 'taxon', '$Family', 'name']],
        Genus: [['determinations', '#1', 'taxon', '$Genus', 'name']],
        Subgenus: [['determinations', '#1', 'taxon', '$Subgenus', 'name']],
        'Species Author': [
          ['determinations', '#1', 'taxon', '$Species', 'author'],
        ],
        Species: [['determinations', '#1', 'taxon', '$Species', 'name']],
        'Subspecies Author': [
          ['determinations', '#1', 'taxon', '$Subspecies', 'author'],
        ],
        Subspecies: [['determinations', '#1', 'taxon', '$Subspecies', 'name']],
        'Prep Type 1': [['preparations', '#1', 'prepType', 'name']],
        Country: [
          ['collectingEvent', 'locality', 'geography', '$Country', 'name'],
        ],
      },
    },
  ]
);

test('circular tables are calculated correctly', () =>
  expect(circularTables()).toMatchInlineSnapshot(`
    [
      "[table Agent]",
      "[table Container]",
      "[table Geography]",
      "[table GeographyTreeDefItem]",
      "[table GeologicTimePeriod]",
      "[table GeologicTimePeriodTreeDefItem]",
      "[table LithoStrat]",
      "[table LithoStratTreeDefItem]",
      "[table ReferenceWork]",
      "[table Storage]",
      "[table StorageTreeDefItem]",
      "[table Taxon]",
      "[table TaxonTreeDefItem]",
      "[table TectonicUnitTreeDefItem]",
      "[table TectonicUnit]",
    ]
  `));
