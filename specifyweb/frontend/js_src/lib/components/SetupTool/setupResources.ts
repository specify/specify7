import type { RA } from '../../utils/types';

type ResourceConfig = {
  readonly resourceName: string;
  readonly endpoint: string;
  readonly fields: RA<FieldConfig>;
};

export type FieldConfig = {
  readonly name: string;
  readonly label: string;
  readonly type?: 'boolean' | 'object' | 'password' | 'select' | 'text';
  readonly required?: boolean;
  readonly description?: string;
  readonly options?: RA<string>;
  readonly fields?: RA<FieldConfig>;
  readonly passwordRepeat?: {
    readonly name: string;
    readonly label: string;
    readonly description: string;
  };
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
        description:
          'The full, official name of the institution (e.g., "University of Kansas Biodiversity Institute").',
        required: true,
      },
      {
        name: 'code',
        label: 'Code',
        description:
          'A short, unique code or acronym for the institution (e.g., "KUBI").',
        required: true,
      },
      {
        name: 'address',
        label: 'Address',
        type: 'object',
        description: 'The address of the institution. Optional.',
        required: true,
        fields: [
          {
            name: 'address',
            label: 'Address',
            description: 'The street address of the institution.',
            required: false,
          },
          {
            name: 'city',
            label: 'City',
            description: 'The city where the institution is located.',
            required: false,
          },
          {
            name: 'state',
            label: 'State/Providence',
            description: 'The state or province.',
            required: false,
          },
          {
            name: 'country',
            label: 'Country',
            description: 'The country.',
            required: false,
          },
          {
            name: 'postalCode',
            label: 'Zip/Postal Code',
            description: 'The postal code.',
            required: false,
          },
          {
            name: 'phone',
            label: 'Phone',
            description: 'A contact phone number.',
            required: false,
          },
        ],
      },
      {
        name: 'isAccessionsGlobal',
        label: 'Define Accession Globally',
        description:
          'Global scope allows you to share Accessions between all divisions. Divisional scope ensures Accessions are specific to each division.',
        type: 'boolean',
      },
      {
        name: 'isSingleGeographyTree',
        label: 'Use Single Geography Tree',
        description:
          'A global geography tree is shared by all disciplines. Otherwise, geography trees are managed separately within each discipline.',
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
      { name: 'collectionName', label: 'Collection Name', required: true },
      { name: 'code', label: 'Code', required: true },
      {
        name: 'catalogNumFormatName',
        label: 'Catalog Number Format',
        type: 'select',
        options: catalogNumberFormats,
        required: true,
      },
    ],
  },
  {
    resourceName: 'SpecifyUser',
    endpoint: '/setup_tool/specifyuser/create/',
    fields: [
      {
        name: 'name',
        label: 'Username',
        description:
          'The username for the primary administrator account (e.g., "spadmin").',
        required: true,
      },
      {
        name: 'password',
        label: 'Password',
        description: 'The password for the account.',
        type: 'password',
        required: true,
        passwordRepeat: {
          name: 'confirmPassword',
          label: 'Confirm Password',
          description: 'Must match the password entered above.',
        },
      },
    ],
  },
];
