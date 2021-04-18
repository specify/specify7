import type { IR } from '../components/wbplanview';
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
            type: 'existingHeader',
            name: 'BMSM No.',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Class', 'name'],
            type: 'existingHeader',
            name: 'Class',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Superfamily',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Family', 'name'],
            type: 'existingHeader',
            name: 'Family',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Genus', 'name'],
            type: 'existingHeader',
            name: 'Genus',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Subgenus', 'name'],
            type: 'existingHeader',
            name: 'Subgenus',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['determinations', '#1', 'taxon', '$Species', 'name'],
            type: 'existingHeader',
            name: 'Species',
            options: {
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
            type: 'existingHeader',
            name: 'Subspecies',
            options: {
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
            type: 'existingHeader',
            name: 'Species Author',
            options: {
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
            type: 'existingHeader',
            name: 'Subspecies Author',
            options: {
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
            type: 'existingHeader',
            name: 'BMSM No.',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Class',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Superfamily',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Family',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Genus',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Subgenus',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Species',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Subspecies',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Species Author',
            options: {
              matchBehavior: 'ignoreNever',
              nullAllowed: true,
              default: null,
            },
          },
          {
            mappingPath: ['0'],
            type: 'existingHeader',
            name: 'Subspecies Author',
            options: {
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
        [
          uploadPlan1.headers,
          (uploadPlan1.uploadPlan as unknown) as UploadPlan,
        ],
        wbPlanViewLines1 as {
          readonly baseTableName: string;
          readonly lines: MappingLine[];
          readonly mustMatchPreferences: IR<boolean>;
        },
      ],
    ],
    WbPlanViewLinesGetter.getLinesFromUploadPlan
  );
}
