import type { LocalizedString } from 'typesafe-i18n';

import { formsText } from '../../localization/forms';
import { setupToolText } from '../../localization/setupTool';
import type { RA } from '../../utils/types';

// Default for max field length.
export const FIELD_MAX_LENGTH = 64;

export type ResourceConfig = {
  readonly resourceName: string;
  readonly label: LocalizedString;
  readonly endpoint: string;
  readonly description?: LocalizedString;
  readonly condition?: Record<
    string,
    Record<string, boolean | number | string>
  >;
  readonly documentationUrl?: string;
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
  readonly maxLength?: number;
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
  { value: 1, label: formsText.forward() },
  { value: -1, label: formsText.reverse() },
];

export const resources: RA<ResourceConfig> = [
  {
    resourceName: 'institution',
    label: setupToolText.institution(),
    description: setupToolText.institutionDescription(),
    endpoint: '/setup_tool/institution/create/',
    documentationUrl:
      'https://discourse.specifysoftware.org/t/specify-setup-configuration-checklist/1056',
    fields: [
      {
        name: 'name',
        label: setupToolText.institutionName(),
        description: setupToolText.institutionNameDescription(),
        required: true,
        maxLength: 255,
      },
      {
        name: 'code',
        label: setupToolText.institutionCode(),
        description: setupToolText.institutionCodeDescription(),
        required: true,
        maxLength: 64,
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
            label: setupToolText.address(),
            description: setupToolText.addressDescription(),
            required: false,
          },
          {
            name: 'city',
            label: setupToolText.addressCity(),
            description: setupToolText.addressCityDescription(),
            required: false,
            maxLength: 64,
          },
          {
            name: 'state',
            label: setupToolText.addressState(),
            description: setupToolText.addressStateDescription(),
            required: false,
            maxLength: 64,
          },
          {
            name: 'country',
            label: setupToolText.addressCountry(),
            description: setupToolText.addressCountryDescription(),
            required: false,
            maxLength: 64,
          },
          {
            name: 'postalCode',
            label: setupToolText.addressPostalCode(),
            description: setupToolText.addressPostalCodeDescription(),
            required: false,
            maxLength: 32,
          },
          {
            name: 'phone1',
            label: setupToolText.addressPhone1(),
            description: setupToolText.addressPhone1Description(),
            required: false,
            maxLength: 50,
          },
        ],
      },
      {
        name: 'isAccessionsGlobal',
        label: setupToolText.institutionIsAccessionGlobal(),
        description: setupToolText.institutionIsAccessionGlobalDescription(),
        type: 'boolean',
      },
      /*
       * {
       *   name: 'isSingleGeographyTree',
       *   label: setupToolText_institutionIsSingleGeographyTree(),  // underscore in comment to avoid failing test
       *   description:
       *     setupToolText_institutionIsSingleGeographyTreeDescription(),
       *   type: 'boolean',
       *   default: false,
       * },
       */
    ],
  },
  {
    resourceName: 'storageTreeDef',
    label: setupToolText.storageTree(),
    endpoint: '/setup_tool/storagetreedef/create/',
    fields: [
      {
        name: 'ranks',
        label: setupToolText.treeRanks(),
        required: false,
        type: 'object',
        // TODO: Rank fields should be generated from a .json file.
        fields: [
          { name: '0', label: 'Site', type: 'boolean', default: true, required: true },
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
        label: setupToolText.fullNameDirection(),
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
      { name: 'name', label: setupToolText.divisionName(), required: true },
      { name: 'abbrev', label: setupToolText.divisionAbbrev(), required: true },
    ],
  },
  {
    resourceName: 'discipline',
    label: setupToolText.discipline(),
    endpoint: '/setup_tool/discipline/create/',
    fields: [
      {
        name: 'name',
        label: setupToolText.disciplineName(),
        required: true,
        maxLength: 64,
      },
      {
        name: 'type',
        label: setupToolText.disciplineType(),
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
    fields: [
      {
        name: 'ranks',
        label: setupToolText.treeRanks(),
        required: false,
        type: 'object',
        fields: [
          { name: '0', label: 'Earth', type: 'boolean', default: true, required: true },
          { name: '100', label: 'Continent', type: 'boolean', default: true },
          { name: '200', label: 'Country', type: 'boolean', default: true },
          { name: '300', label: 'State', type: 'boolean', default: true },
          { name: '400', label: 'County', type: 'boolean', default: true },
        ],
      },
      {
        name: 'fullNameDirection',
        label: setupToolText.fullNameDirection(),
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
      /*
       * {
       *   name: 'default',
       *   label: setupToolText_defaultTree(), // underscore in comment to avoid failing test
       *   type: 'boolean',
       * },
       */
    ],
  },
  {
    resourceName: 'taxonTreeDef',
    label: setupToolText.taxonTree(),
    endpoint: '/setup_tool/taxontreedef/create/',
    fields: [
      {
        name: 'ranks',
        label: setupToolText.treeRanks(),
        required: false,
        type: 'object',
        fields: [
          { name: '0', label: 'Life', type: 'boolean', default: true, required: true },
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
        label: setupToolText.fullNameDirection(),
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
      /*
       * TODO: Select which Taxon tree to import (Re-use dialog from default tree creation in tree viewer)
       * {
       *   name: 'default',
       *   label: setupToolText_defaultTree(), // underscore in comment to avoid failing test
       *   type: 'boolean',
       * },
       */
    ],
  },
  {
    resourceName: 'collection',
    label: setupToolText.collection(),
    endpoint: '/setup_tool/collection/create/',
    fields: [
      {
        name: 'collectionName',
        label: setupToolText.collectionName(),
        required: true,
        maxLength: 50,
      },
      {
        name: 'code',
        label: setupToolText.collectionCode(),
        required: true,
        maxLength: 50,
      },
      {
        name: 'catalogNumFormatName',
        label: setupToolText.collectionCatalogNumFormatName(),
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
        label: setupToolText.specifyUserName(),
        description: setupToolText.specifyUserNameDescription(),
        required: true,
        maxLength: 64,
      },
      {
        name: 'password',
        label: setupToolText.specifyUserPassword(),
        description: setupToolText.specifyUserPasswordDescription(),
        type: 'password',
        required: true,
        passwordRepeat: {
          name: 'confirmPassword',
          label: setupToolText.specifyUserConfirmPassword(),
          description: setupToolText.specifyUserConfirmPasswordDescription(),
        },
        maxLength: 255,
      },
      {
        name: 'firstname',
        label: setupToolText.specifyUserFirstName(),
        description: setupToolText.specifyUserFirstNameDescription(),
        required: false,
        maxLength: 50,
      },
      {
        name: 'lastname',
        label: setupToolText.specifyUserLastName(),
        description: setupToolText.specifyUserLastNameDescription(),
        required: true,
        maxLength: 256,
      },
    ],
  },
];
