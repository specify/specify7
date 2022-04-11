import {
  AutoMapper,
  type AutoMapperConstructorParameters,
} from '../automapper';
import { runTest } from './testmain';
import { RA } from '../types';

export default function (): void {
  runTest(
    'AutoMapper',
    [
      [
        [
          {
            getMappedFields: (): RA<never> => [],
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
              'ID Date Verbatim',
              'ID Date',
              'ID Status',
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
            baseTable: 'CollectionObject',
            scope: 'autoMapper',
          },
        ],
        {
          'Cataloged by': [['cataloger', 'lastname']],
          'End Date Collected': [['collectingevent', 'enddate']],
          'Collection Method': [['collectingevent', 'method']],
          'Start Date Collected': [['collectingevent', 'startdate']],
          'ID Date': [['determinations', '#1', 'determineddate']],
          'ID Status': [['determinations', '#1', 'typestatusname']],
          'Lat Long Type': [['collectingevent', 'locality', 'latlongtype']],
          Latitude1: [['collectingevent', 'locality', 'latitude1']],
          Latitude2: [['collectingevent', 'locality', 'latitude2']],
          Longitude1: [['collectingevent', 'locality', 'longitude1']],
          Longitude2: [['collectingevent', 'locality', 'longitude2']],
          'Max Depth (M)': [['collectingevent', 'locality', 'maxelevation']],
          'Min Depth (M)': [['collectingevent', 'locality', 'minelevation']],
          'Who ID First Name': [
            ['determinations', '#1', 'determiner', 'firstname'],
          ],
          'Determiner 1 First Name': [
            ['determinations', '#2', 'determiner', 'firstname'],
          ],
          'Determiner 1 Last Name': [
            ['determinations', '#1', 'determiner', 'lastname'],
          ],
          'Determiner 1 Middle Initial': [
            ['determinations', '#1', 'determiner', 'middleinitial'],
          ],
          'Determiner 1 Title': [
            ['determinations', '#1', 'determiner', 'title'],
          ],
          'Collector 1 First Name': [
            ['collectingevent', 'collectors', '#1', 'agent', 'firstname'],
          ],
          'Collector 2 First Name': [
            ['collectingevent', 'collectors', '#2', 'agent', 'firstname'],
          ],
          'Collector 3 First Name': [
            ['collectingevent', 'collectors', '#3', 'agent', 'firstname'],
          ],
          'Collector 4 First Name': [
            ['collectingevent', 'collectors', '#4', 'agent', 'firstname'],
          ],
          'Collector 1 Last Name': [
            ['collectingevent', 'collectors', '#1', 'agent', 'lastname'],
          ],
          'Collector 2 Last name': [
            ['collectingevent', 'collectors', '#2', 'agent', 'lastname'],
          ],
          'Collector 3 Last Name': [
            ['collectingevent', 'collectors', '#3', 'agent', 'lastname'],
          ],
          'Collector 4 Last Name': [
            ['collectingevent', 'collectors', '#4', 'agent', 'lastname'],
          ],
          'Collector 1 Middle Initial': [
            ['collectingevent', 'collectors', '#1', 'agent', 'middleinitial'],
          ],
          'Collector 2 Middle Initial': [
            ['collectingevent', 'collectors', '#2', 'agent', 'middleinitial'],
          ],
          'Collector 3 Middle Initial': [
            ['collectingevent', 'collectors', '#3', 'agent', 'middleinitial'],
          ],
          'Collector 4 Middle Initial': [
            ['collectingevent', 'collectors', '#4', 'agent', 'middleinitial'],
          ],
          'Collector 1 Title': [
            ['collectingevent', 'collectors', '#1', 'agent', 'title'],
          ],
          'Collector 2 Title': [
            ['collectingevent', 'collectors', '#2', 'agent', 'title'],
          ],
          'Collector 3 Title': [
            ['collectingevent', 'collectors', '#3', 'agent', 'title'],
          ],
          'Collector 4 Title': [
            ['collectingevent', 'collectors', '#4', 'agent', 'title'],
          ],
          'Accession No.': [['accession', 'accessionnumber']],
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
          Subspecies: [
            ['determinations', '#1', 'taxon', '$Subspecies', 'name'],
          ],
          'Prep Type 1': [['preparations', '#1', 'preptype', 'name']],
          'Continent/Ocean': [
            ['collectingevent', 'locality', 'geography', '$Continent', 'name'],
          ],
          Country: [
            ['collectingevent', 'locality', 'geography', '$Country', 'name'],
          ],
          'State/Prov/Pref': [
            ['collectingevent', 'locality', 'geography', '$State', 'name'],
          ],
        },
      ],
    ],
    (parameters: AutoMapperConstructorParameters) =>
      new AutoMapper(parameters).map()
  );
}
