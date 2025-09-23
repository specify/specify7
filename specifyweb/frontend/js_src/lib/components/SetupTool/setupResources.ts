import type { RA } from '../../utils/types';
import { setupToolText } from '../../localization/setupTool';

type ResourceConfig = {
  readonly resourceName: string;
  readonly endpoint: string;
  readonly fields: RA<FieldConfig>;
};

type FieldConfig = {
  readonly name: string;
  readonly label: string;
  readonly type?: 'boolean' | 'password' | 'select' | 'text';
  readonly required?: boolean;
  readonly description?: string;
  readonly options?: RA<string>;
};

const disciplineTypeOptions = [
  'fish',
  'herpetology',
  'paleobotany',
  'invertpaleo',
  'vertpaleo',
  'bird',
  'mammal',
  'insect',
  'botany',
  'invertebrate',
  'minerals',
  'geology',
  'anthropology',
  /*
   * 'vascplant',
   * 'fungi',
   */
];

const catalogNumberFormats = [
  'CatalogNumber',
  'CatalogNumberAlphaNumByYear',
  'CatalogNumberNumeric',
  'CatalogNumberString',
];

export const resources: RA<ResourceConfig> = [
  {
    resourceName: 'Institution',
    endpoint: '/setup_tool/institution/create/',
    fields: [
      {
        name: 'name',
        label: 'Name',
        description: 'The full, official name of the institution (e.g., "University of Kansas Biodiversity Institute").',
        required: true,
      },
      { name: 'code',
        label: 'Code',
        description: 'A short, unique code or acronym for the institution (e.g., "KUBI").',
        required: true,
      },
      {
        name: 'isAccessionsGlobal',
        label: 'Define Accession Globally',
        description: 'Controls accession numbering. Options: Global (default) or Divisional. A tooltip will explain: "Global scope allows you to share Accessions between all divisions. Divisional scope ensures Accessions are specific to each division',
        type: 'boolean',
      },
      {
        name: 'isSingleGeographyTree',
        label: 'Use Single Geography Tree',
        description: 'Controls geography definitions. Options: Global (default) or by Discipline. A tooltip will explain: "A global geography tree is shared by all disciplines. Otherwise, geography trees are managed separately within each discipline."',
        type: 'boolean',
      },
    ],
  },
  {
    resourceName: 'Division',
    endpoint: '/setup_tool/division/create/',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'abbrev', label: 'Abbreviation', required: true },
    ],
  },
  {
    resourceName: 'Discipline',
    endpoint: '/setup_tool/discipline/create/',
    fields: [
      { name: 'name', label: 'Name', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: disciplineTypeOptions,
      },
    ],
  },
  {
    resourceName: 'Collection',
    endpoint: '/setup_tool/collection/create/',
    fields: [
      { name: 'collectionName', label: 'Collection Name' },
      { name: 'code', label: 'Code' },
      {
        name: 'catalogNumFormatName',
        label: 'Catalog Number Format',
        type: 'select',
        options: catalogNumberFormats,
      },
    ],
  },
  {
    resourceName: 'SpecifyUser',
    endpoint: '/setup_tool/specifyuser/create/',
    fields: [
      { name: 'name', label: 'Username', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ],
  },
];
