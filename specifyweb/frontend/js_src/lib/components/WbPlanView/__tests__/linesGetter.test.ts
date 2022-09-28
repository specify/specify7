import type { MappingLine } from '../Mapper';
import type { Tables } from '../../DataModel/types';
import type { IR, RA } from '../../../utils/types';
import type { UploadPlan } from '../uploadPlanParser';
import { getLinesFromHeaders, getLinesFromUploadPlan } from '../linesGetter';
import uploadPlan1 from '../../../tests/fixtures/uploadplan.1.json';
import wbPlanViewLines1 from '../../../tests/fixtures/wbplanviewlines.1.json';
import { requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';

requireContext();

theories(getLinesFromHeaders, [
  {
    in: [
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
    out: [
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
  },
  {
    in: [
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
    out: [
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
  },
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
