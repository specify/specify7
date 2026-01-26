import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { setupToolText } from '../../localization/setupTool';
import { statsText } from '../../localization/stats';
import type { RA } from '../../utils/types';

// Default for max field length.
export const FIELD_MAX_LENGTH = 64;

export type ResourceConfig = {
  readonly resourceName: string;
  readonly label: LocalizedString;
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
  readonly type?:
    | 'boolean'
    | 'object'
    | 'password'
    | 'select'
    | 'text'
    | 'tree';
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
  readonly width?: number;
  readonly isTable?: boolean;
};

// Discipline list from backend/context/app_resource.py
export const disciplineTypeOptions = [
  { value: 'fish', label: 'Ichthyology' },
  { value: 'herpetology', label: 'Herpetology' },
  { value: 'paleobotany', label: 'Paleobotany' },
  { value: 'invertpaleo', label: 'Invertebrate Paleontology' },
  { value: 'vertpaleo', label: 'Vertebrate Paleontology' },
  { value: 'bird', label: 'Ornithology' },
  { value: 'mammal', label: 'Mammalogy' },
  { value: 'insect', label: 'Entomology' },
  { value: 'botany', label: 'Botany' },
  { value: 'invertebrate', label: 'Invertebrate Zoology' },
  { value: 'geology', label: 'Geology' },
];

/*
 * Must match config/backstop/uiformatters.xml
 * TODO: Fetch uiformatters.xml from the backend instead and use UIFormatter.placeholder
 */
const currentYear = new Date().getFullYear();
const catalogNumberFormats = [
  { value: 'CatalogNumber', label: `CatalogNumber (${currentYear}-######)` },
  {
    value: 'CatalogNumberAlphaNumByYear',
    label: `CatalogNumberAlphaNumByYear (${currentYear}-######)`,
  },
  { value: 'CatalogNumberNumeric', label: 'CatalogNumberNumeric (#########)' },
  { value: 'CatalogNumberString', label: commonText.none() },
];

const fullNameDirections = [
  { value: 1, label: formsText.forward() },
  { value: -1, label: formsText.reverse() },
];

function generateTreeRankFields(
  rankNames: RA<string>,
  enabled: RA<string>,
  enforced: RA<string>,
  inFullName: RA<string>,
  separator: string = ' '
): RA<FieldConfig> {
  return rankNames.map(
    (rankName, index) =>
      ({
        name: rankName.toLowerCase(),
        label: rankName,
        type: 'object',
        fields: [
          {
            name: 'include',
            label: setupToolText.include(),
            description: setupToolText.includeDescription(),
            type: 'boolean',
            default: index === 0 || enabled.includes(rankName),
            required: index === 0,
            width: 1,
          },
          {
            name: 'enforced',
            label: setupToolText.enforced(),
            description: setupToolText.enforcedDescription(),
            type: 'boolean',
            default: index === 0 || enforced.includes(rankName),
            required: index === 0,
            width: 1,
          },
          {
            name: 'infullname',
            label: setupToolText.inFullName(),
            description: setupToolText.inFullNameDescription(),
            type: 'boolean',
            default: inFullName.includes(rankName),
            width: 1,
          },
          {
            name: 'fullnameseparator',
            label: setupToolText.fullNameSeparator(),
            description: setupToolText.fullNameSeparatorDescription(),
            type: 'text',
            default: separator,
            width: 1,
          },
        ],
      }) as FieldConfig
  );
}

export const resources: RA<ResourceConfig> = [
  {
    resourceName: 'institution',
    label: setupToolText.institution(),
    description: setupToolText.institutionDescription(),
    documentationUrl:
      'https://discourse.specifysoftware.org/t/guided-setup/3234',
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
    ],
  },
  {
    resourceName: 'storageTreeDef',
    label: setupToolText.storageTree(),
    fields: [
      {
        name: 'ranks',
        label: setupToolText.treeRanks(),
        required: false,
        type: 'object',
        isTable: true,
        // TODO: Rank fields should be generated from a .json file.
        fields: generateTreeRankFields(
          [
            'Site',
            'Building',
            'Collection',
            'Room',
            'Aisle',
            'Cabinet',
            'Shelf',
            'Box',
            'Rack',
            'Vial',
          ],
          ['Site', 'Building', 'Collection', 'Room', 'Aisle', 'Cabinet'],
          [],
          ['Building', 'Collection', 'Room', 'Aisle', 'Cabinet'],
          ', '
        ),
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
    fields: [
      { name: 'name', label: setupToolText.divisionName(), required: true },
      { name: 'abbrev', label: setupToolText.divisionAbbrev(), required: true },
    ],
  },
  {
    resourceName: 'discipline',
    label: setupToolText.discipline(),
    fields: [
      {
        name: 'type',
        label: setupToolText.disciplineType(),
        type: 'select',
        options: disciplineTypeOptions,
        required: true,
      },
      {
        name: 'name',
        label: setupToolText.disciplineName(),
        required: true,
        maxLength: 64,
      },
    ],
  },
  {
    resourceName: 'geographyTreeDef',
    label: setupToolText.geographyTree(),
    fields: [
      {
        name: 'ranks',
        label: setupToolText.treeRanks(),
        required: false,
        type: 'object',
        isTable: true,
        fields: generateTreeRankFields(
          ['Earth', 'Continent', 'Country', 'State', 'County'],
          ['Earth', 'Continent', 'Country', 'State', 'County'],
          ['Earth', 'Continent', 'Country', 'State', 'County'],
          ['Country', 'State', 'County'],
          ', '
        ),
      },
      {
        name: 'fullNameDirection',
        label: setupToolText.fullNameDirection(),
        type: 'select',
        options: fullNameDirections,
        required: true,
        default: fullNameDirections[0].value.toString(),
      },
      {
        name: 'preload',
        label: setupToolText.preloadTree(),
        description: setupToolText.preloadTreeDescription(),
        type: 'boolean',
      },
    ],
  },
  {
    resourceName: 'taxonTreeDef',
    label: setupToolText.taxonTree(),
    fields: [
      /*
       * {
       *   name: 'ranks',
       *   label: setupToolText.treeRanks(),
       *   required: false,
       *   type: 'object',
       *   isTable: true,
       *   fields: generateTreeRankFields(
       *     [
       *       'Life',
       *       'Kingdom',
       *       'Phylum',
       *       'Subphylum',
       *       'Class',
       *       'Subclass',
       *       'Superorder',
       *       'Order',
       *       'Family',
       *       'Subfamily',
       *       'Genus',
       *       'Species',
       *       'Subspecies',
       *     ],
       *     [
       *       'Life',
       *       'Kingdom',
       *       'Phylum',
       *       'Class',
       *       'Order',
       *       'Family',
       *       'Genus',
       *       'Species',
       *     ],
       *     [
       *       'Life',
       *       'Kingdom',
       *       'Phylum',
       *       'Class',
       *       'Order',
       *       'Family',
       *       'Genus',
       *       'Species',
       *     ],
       *     ['Genus', 'Species'],
       *     ' '
       *   ),
       * },
       * {
       *   name: 'fullNameDirection',
       *   label: setupToolText.fullNameDirection(),
       *   type: 'select',
       *   options: fullNameDirections,
       *   required: true,
       *   default: fullNameDirections[0].value.toString(),
       * },
       */
      {
        name: 'preload',
        label: setupToolText.preloadTree(),
        description: setupToolText.preloadTreeDescription(),
        type: 'boolean',
      },
      {
        name: 'preloadFile',
        label: setupToolText.treeToPreload(),
        description: setupToolText.preloadTreeDescription(),
        type: 'tree',
      },
    ],
  },
  {
    resourceName: 'collection',
    label: statsText.collection(),
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
        default: 'CatalogNumberNumeric',
      },
    ],
  },
  {
    resourceName: 'specifyUser',
    label: setupToolText.specifyUser(),
    fields: [
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
    ],
  },
];
