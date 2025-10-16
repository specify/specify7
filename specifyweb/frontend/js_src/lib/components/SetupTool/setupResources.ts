import type { LocalizedString } from 'typesafe-i18n';

import { setupToolText } from '../../localization/setupTool';
import type { RA } from '../../utils/types';

export type ResourceConfig = {
  readonly resourceName: string;
  readonly label: LocalizedString;
  readonly endpoint: string;
  readonly description?: LocalizedString;
  readonly condition?: Record<
    string,
    Record<string, boolean | number | string>
  >;
  readonly fields: RA<FieldConfig>;
};

type Option = {
  readonly value: number | string;
  readonly label?: string;
};

export type FieldConfig = {
  readonly name: string;
  readonly label: string;
  readonly type?: 'boolean' | 'object' | 'password' | 'select' | 'text';
  readonly required?: boolean;
  readonly default?: boolean | number | string;
  readonly description?: string;
  readonly options?: RA<Option>;
  readonly fields?: RA<FieldConfig>;
  readonly passwordRepeat?: {
    readonly name: string;
    readonly label: string;
    readonly description: string;
  };
};

// Discipline list from backend/context/app_resource.py
const disciplineTypeOptions = [
  { value: 'fish', label: 'Fish' },
  { value: 'herpetology', label: 'Herpetology' },
  { value: 'paleobotany', label: 'Paleobotany' },
  { value: 'invertpaleo', label: 'Invertebrate Paleontology' },
  { value: 'vertpaleo', label: 'Vertebrate Paleontology' },
  { value: 'bird', label: 'Bird' },
  { value: 'mammal', label: 'Mammal' },
  { value: 'insect', label: 'Insect' },
  { value: 'botany', label: 'Botany' },
  { value: 'invertebrate', label: 'Invertebrate' },
  { value: 'geology', label: 'Geology' },
];

const catalogNumberFormats = [
  { value: 'CatalogNumber' },
  { value: 'CatalogNumberAlphaNumByYear' },
  { value: 'CatalogNumberNumeric' },
  { value: 'CatalogNumberString' },
];

const fullNameDirections = [
  { value: 1, label: 'Forward' },
  { value: -1, label: 'Reverse' },
];

export const resources: RA<ResourceConfig> = [
  {
    resourceName: 'institution',
    label: setupToolText.institution(),
    description: setupToolText.institutionDescription(),
    endpoint: '/setup_tool/institution/create/',
    fields: [
      {
        name: 'name',
        label: setupToolText.institutionName(),
        description: setupToolText.institutionNameDescription(),
        required: true,
      },
      {
        name: 'code',
        label: setupToolText.institutionCode(),
        description: setupToolText.institutionCodeDescription(),
        required: true,
      },
      {
        name: 'address',
        label: setupToolText.institutionAddress(),
        type: 'object',
        description: setupToolText.institutionAddressDescription(),
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
            name: 'phone1',
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
        default: false,
      },
    ],
  },
  {
    resourceName: 'storageTreeDef',
    label: setupToolText.storageTree(),
    endpoint: '/setup_tool/storagetreedef/create/',
    fields: [
      {
        name: 'ranks',
        label: 'Tree Ranks',
        required: false,
        type: 'object',
        // TODO: Rank fields should be generated from a .json file.
        fields: [
          { name: '0', label: 'Site', type: 'boolean', default: true },
          { name: '100', label: 'Building', type: 'boolean' },
          { name: '150', label: 'Collection', type: 'boolean' },
          { name: '200', label: 'Room', type: 'boolean' },
          { name: '250', label: 'Aisle', type: 'boolean' },
          { name: '300', label: 'Cabinet', type: 'boolean' },
          { name: '350', label: 'Shelf', type: 'boolean' },
          { name: '400', label: 'Box', type: 'boolean' },
          { name: '450', label: 'Rack', type: 'boolean' },
          { name: '500', label: 'Vial', type: 'boolean' },
        ],
      },
      // TODO: This should be name direction. Each rank should have configurable formats, too.,
      {
        name: 'fullNameDirection',
        label: 'Full Name Direction',
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
    ],
  },
  {
    resourceName: 'globalGeographyTreeDef',
    label: setupToolText.geographyTree(),
    endpoint: '/setup_tool/global_geographytreedef/create/',
    condition: {
      institution: {
        isSingleGeographyTree: true,
      },
    },
    fields: [
      {
        name: 'ranks',
        label: 'Tree Ranks',
        required: false,
        type: 'object',
        fields: [
          { name: '0', label: 'Earth', type: 'boolean', default: true },
          { name: '100', label: 'Continent', type: 'boolean', default: true },
          { name: '200', label: 'Country', type: 'boolean', default: true },
          { name: '300', label: 'State', type: 'boolean', default: true },
          { name: '400', label: 'County', type: 'boolean', default: true },
        ],
      },
      {
        name: 'fullNameDirection',
        label: 'Full Name Direction',
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
    ],
  },
  {
    resourceName: 'division',
    label: setupToolText.division(),
    endpoint: '/setup_tool/division/create/',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'abbrev', label: 'Abbreviation', required: true },
    ],
  },
  {
    resourceName: 'discipline',
    label: setupToolText.discipline(),
    endpoint: '/setup_tool/discipline/create/',
    fields: [
      { name: 'name', label: 'Name', required: true },
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: disciplineTypeOptions,
        required: true,
      },
    ],
  },
  {
    resourceName: 'geographyTreeDef',
    label: setupToolText.geographyTree(),
    endpoint: '/setup_tool/geographytreedef/create/',
    condition: {
      institution: {
        isSingleGeographyTree: false,
      },
    },
    fields: [
      {
        name: 'ranks',
        label: 'Tree Ranks',
        required: false,
        type: 'object',
        fields: [
          { name: '0', label: 'Earth', type: 'boolean', default: true },
          { name: '100', label: 'Continent', type: 'boolean', default: true },
          { name: '200', label: 'Country', type: 'boolean', default: true },
          { name: '300', label: 'State', type: 'boolean', default: true },
          { name: '400', label: 'County', type: 'boolean', default: true },
        ],
      },
      {
        name: 'fullNameDirection',
        label: 'Full Name Direction',
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
    ],
  },
  {
    resourceName: 'taxonTreeDef',
    label: setupToolText.taxonTree(),
    endpoint: '/setup_tool/taxontreedef/create/',
    fields: [
      {
        name: 'ranks',
        label: 'Tree Ranks',
        required: false,
        type: 'object',
        fields: [
          { name: '0', label: 'Life', type: 'boolean', default: true },
          { name: '10', label: 'Kingdom', type: 'boolean', default: true },
          { name: '30', label: 'Phylum', type: 'boolean', default: true },
          { name: '40', label: 'Subphylum', type: 'boolean', default: true },
          { name: '60', label: 'Class', type: 'boolean', default: true },
          { name: '70', label: 'Subclass', type: 'boolean', default: false },
          { name: '90', label: 'Superorder', type: 'boolean', default: false },
          { name: '100', label: 'Order', type: 'boolean', default: true },
          { name: '140', label: 'Family', type: 'boolean', default: true },
          { name: '150', label: 'Subfamily', type: 'boolean', default: false },
          { name: '180', label: 'Genus', type: 'boolean', default: true },
          { name: '220', label: 'Species', type: 'boolean', default: true },
          { name: '230', label: 'Subspecies', type: 'boolean', default: false },
        ],
      },
      {
        name: 'fullNameDirection',
        label: 'Full Name Direction',
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
    ],
  },
  {
    resourceName: 'collection',
    label: setupToolText.collection(),
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
    resourceName: 'specifyUser',
    label: setupToolText.specifyUser(),
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
