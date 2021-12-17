import type { IR, RA } from '../types';
import type { MappingLine } from '../components/wbplanviewmapper';
import type { UploadPlan } from '../uploadplantomappingstree';
import * as WbPlanViewLinesGetter from '../wbplanviewlinesgetter';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import wbPlanViewLines1 from './fixtures/wbplanviewlines.1.json';
import { loadDataModel, runTest } from './testmain';

export default function (): void {
  loadDataModel();

  runTest(
    'WbPlanViewLinesGetter.getLinesFromHeaders',
    [
      [
        [
          {
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
            ],
            runAutomapper: true,
            baseTableName: 'collectionobject',
          },
        ],
        [
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'BMSM No.',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Class', 'name'],
            mappingType: 'existingHeader',
            headerName: 'Class',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Superfamily',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Family', 'name'],
            mappingType: 'existingHeader',
            headerName: 'Family',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Genus', 'name'],
            mappingType: 'existingHeader',
            headerName: 'Genus',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Subgenus', 'name'],
            mappingType: 'existingHeader',
            headerName: 'Subgenus',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Species', 'name'],
            mappingType: 'existingHeader',
            headerName: 'Species',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: [
              'determinations',
              '#1',
              'taxon',
              '$Subspecies',
              'name',
            ],
            mappingType: 'existingHeader',
            headerName: 'Subspecies',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: [
              'determinations',
              '#1',
              'taxon',
              '$Species',
              'author',
            ],
            mappingType: 'existingHeader',
            headerName: 'Species Author',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: [
              'determinations',
              '#1',
              'taxon',
              '$Subspecies',
              'author',
            ],
            mappingType: 'existingHeader',
            headerName: 'Subspecies Author',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
        ],
      ],
      [
        [
          {
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
            ],
            runAutomapper: false,
            baseTableName: 'collectionobject',
          },
        ],
        [
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'BMSM No.',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Class',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Superfamily',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Family',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Genus',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Subgenus',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Species',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Subspecies',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Species Author',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            mappingType: 'existingHeader',
            headerName: 'Subspecies Author',
            columnOptions: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
        ],
      ],
    ],
    WbPlanViewLinesGetter.getLinesFromHeaders
  );

  runTest(
    'WbPlanViewLinesGetter.getLinesFromUploadPlan',
    [
      [
        [uploadPlan1.headers, uploadPlan1.uploadPlan as unknown as UploadPlan],
        wbPlanViewLines1 as {
          readonly baseTableName: string;
          readonly lines: RA<MappingLine>;
          readonly mustMatchPreferences: IR<boolean>;
        },
      ],
    ],
    WbPlanViewLinesGetter.getLinesFromUploadPlan
  );
}
