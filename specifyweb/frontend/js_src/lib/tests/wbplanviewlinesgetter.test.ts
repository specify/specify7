import type { MappingLine } from '../components/wbplanviewmapper';
import type { Tables } from '../datamodel';
import type { IR, RA } from '../types';
import type { UploadPlan } from '../uploadplanparser';
import uploadPlan1 from './fixtures/uploadplan.1.json';
import wbPlanViewLines1 from './fixtures/wbplanviewlines.1.json';
import { theories } from './utils';
import {
  getLinesFromHeaders,
  getLinesFromUploadPlan,
} from '../wbplanviewlinesgetter';

theories(getLinesFromHeaders, [
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
        runAutoMapper: true,
        baseTableName: 'CollectionObject',
      },
    ],
    [
      {
        mappingPath: ['0'],
        headerName: 'BMSM No.',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Class', 'name'],
        headerName: 'Class',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Superfamily',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Family', 'name'],
        headerName: 'Family',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Genus', 'name'],
        headerName: 'Genus',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Subgenus', 'name'],
        headerName: 'Subgenus',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Species', 'name'],
        headerName: 'Species',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Subspecies', 'name'],
        headerName: 'Subspecies',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Species', 'author'],
        headerName: 'Species Author',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['determinations', '#1', 'taxon', '$Subspecies', 'author'],
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
        runAutoMapper: false,
        baseTableName: 'CollectionObject',
      },
    ],
    [
      {
        mappingPath: ['0'],
        headerName: 'BMSM No.',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Class',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Superfamily',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Family',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Genus',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Subgenus',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Species',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Subspecies',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Species Author',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
      {
        mappingPath: ['0'],
        headerName: 'Subspecies Author',
        columnOptions: {
          matchBehavior: 'ignoreNever',
          nullAllowed: true,
          default: null,
        },
      },
    ],
  ],
]);

theories(getLinesFromUploadPlan, [
  [
    [uploadPlan1.headers, uploadPlan1.uploadPlan as unknown as UploadPlan],
    wbPlanViewLines1 as {
      readonly baseTableName: keyof Tables;
      readonly lines: RA<MappingLine>;
      readonly mustMatchPreferences: IR<boolean>;
    },
  ],
]);
