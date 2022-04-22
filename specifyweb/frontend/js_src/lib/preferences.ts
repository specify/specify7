/**
 * Definitions for User Interface preferences (scoped to a SpecifyUser)
 */

import { crash } from './components/errorboundary';
import {
  CollectionSortOrderPreferenceItem,
  ColorPickerPreferenceItem,
  defaultFont,
  FontFamilyPreferenceItem,
} from './components/preferencesrenderers';
import {
  handleLanguageChange,
  LanguagePreferencesItem,
  SchemaLanguagePreferenceItem,
} from './components/toolbar/language';
import type { Collection } from './datamodel';
import { commonText } from './localization/common';
import { formsText } from './localization/forms';
import { preferencesText } from './localization/preferences';
import type { Language } from './localization/utils';
import { DEFAULT_LANGUAGE } from './localization/utils';
import { wbText } from './localization/workbench';
import type { JavaType } from './specifyfield';
import type { IR, RA } from './types';
import { ensure } from './types';
import type { Parser } from './uiparse';

// Custom Renderer for a preference item
export type PreferenceItemComponent<VALUE> = (props: {
  readonly definition: PreferenceItem<VALUE>;
  readonly value: VALUE;
  readonly onChange: (value: VALUE) => void;
}) => JSX.Element;

export type PreferenceItem<VALUE> = {
  readonly title: string;
  readonly description?: string;
  // Whether app needs to be reloaded if this preference changes
  readonly requiresReload: boolean;
  /*
   * Whether to render this item in the Preferences Menu
   * Invisible items are usually set by components outside the preferences menu
   *
   * If 'adminsOnly' then visible only to admin users
   */
  readonly visible: boolean | 'adminsOnly';
  readonly defaultValue: VALUE;
  // Custom onChange handler
  readonly onChange?: (value: VALUE) => void | Promise<void>;
} & (
  | {
      readonly values:
        | RA<VALUE>
        | RA<{
            readonly value: VALUE;
            readonly title?: string;
            readonly description?: string;
          }>;
    }
  | {
      // Parses the stored value. Determines the input type to render
      readonly parser: Parser | JavaType;
    }
  | {
      readonly renderer: PreferenceItemComponent<VALUE>;
    }
);

const defineItem = <VALUE>(
  definition: PreferenceItem<VALUE>
): PreferenceItem<VALUE> => definition;

export type GenericPreferencesCategories = IR<{
  readonly title: string;
  readonly description?: string;
  readonly subCategories: IR<{
    readonly title: string;
    readonly description?: string;
    readonly items: IR<PreferenceItem<any>>;
  }>;
}>;
export const preferenceDefinitions = {
  general: {
    title: preferencesText('general'),
    subCategories: {
      ui: {
        title: preferencesText('ui'),
        items: {
          language: defineItem<Language>({
            title: preferencesText('language'),
            requiresReload: true,
            visible: true,
            defaultValue: DEFAULT_LANGUAGE,
            onChange: handleLanguageChange,
            renderer: LanguagePreferencesItem,
          }),
          theme: defineItem<'system' | 'light' | 'dark'>({
            title: preferencesText('theme'),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText('system'),
                description: preferencesText('inheritOsSettings'),
              },
              {
                value: 'light',
                title: preferencesText('light'),
              },
              {
                value: 'dark',
                title: preferencesText('dark'),
              },
            ],
          }),
          reduceMotion: defineItem<'system' | 'reduce' | 'noPreference'>({
            title: preferencesText('reduceMotion'),
            description: preferencesText('reduceMotionDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText('system'),
                description: preferencesText('inheritOsSettings'),
              },
              {
                value: 'reduce',
                title: preferencesText('reduce'),
              },
              {
                value: 'noPreference',
                title: preferencesText('noPreference'),
              },
            ],
          }),
          reduceTransparency: defineItem<'system' | 'reduce' | 'noPreference'>({
            title: preferencesText('reduceTransparency'),
            description: preferencesText('reduceTransparencyDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText('system'),
                description: preferencesText('inheritOsSettings'),
              },
              {
                value: 'reduce',
                title: preferencesText('reduce'),
              },
              {
                value: 'noPreference',
                title: preferencesText('noPreference'),
              },
            ],
          }),
          fontSize: defineItem<number>({
            title: preferencesText('fontSize'),
            requiresReload: false,
            visible: true,
            defaultValue: 100,
            parser: {
              type: 'number',
              min: 1,
              max: 1000,
            },
          }),
          scaleInterface: defineItem<boolean>({
            title: preferencesText('scaleInterface'),
            description: preferencesText('scaleInterfaceDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          fontFamily: defineItem<string>({
            title: preferencesText('fontFamily'),
            description: preferencesText('fontFamilyDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
          }),
        },
      },
      application: {
        title: preferencesText('application'),
        items: {
          allowDismissingErrors: defineItem<boolean>({
            title: preferencesText('allowDismissingErrors'),
            requiresReload: false,
            visible: 'adminsOnly',
            defaultValue: false,
            parser: 'java.lang.Boolean',
          }),
        },
      },
      dialog: {
        title: preferencesText('dialogs'),
        items: {
          updatePageTitle: defineItem<boolean>({
            title: preferencesText('updatePageTitle'),
            description: preferencesText('updatePageTitleDialogDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          transparentBackground: defineItem<boolean>({
            title: preferencesText('translucentDialog'),
            description: preferencesText('translucentDialogDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            parser: 'java.lang.Boolean',
          }),
          showIcon: defineItem<boolean>({
            title: preferencesText('showDialogIcon'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  header: {
    title: preferencesText('header'),
    subCategories: {
      menu: {
        title: preferencesText('menu'),
        items: {
          showDataEntry: defineItem<boolean>({
            title: preferencesText('showDataEntry'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showInteractions: defineItem<boolean>({
            title: preferencesText('showInteractions'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showTrees: defineItem<boolean>({
            title: preferencesText('showTrees'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showRecordSets: defineItem<boolean>({
            title: preferencesText('showRecordSets'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showQueries: defineItem<boolean>({
            title: preferencesText('showQueries'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showReports: defineItem<boolean>({
            title: preferencesText('showReports'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showAttachments: defineItem<boolean>({
            title: preferencesText('showAttachments'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          showWorkBench: defineItem<boolean>({
            title: preferencesText('showWorkBench'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  form: {
    title: commonText('forms'),
    subCategories: {
      schema: {
        title: commonText('schemaConfig'),
        items: {
          language: defineItem<string>({
            title: preferencesText('language'),
            requiresReload: true,
            visible: true,
            defaultValue: DEFAULT_LANGUAGE,
            renderer: SchemaLanguagePreferenceItem,
          }),
        },
      },
      ui: {
        title: preferencesText('ui'),
        items: {
          updatePageTitle: defineItem<boolean>({
            title: preferencesText('updatePageTitle'),
            description: preferencesText('updatePageTitleFormDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          fontSize: defineItem<number>({
            title: preferencesText('fontSize'),
            requiresReload: false,
            visible: true,
            defaultValue: 100,
            parser: {
              type: 'number',
              min: 1,
              max: 1000,
            },
          }),
          // FIXME: support passing a URL
          fontFamily: defineItem<string>({
            title: preferencesText('fontFamily'),
            description: preferencesText('fontFamilyDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
          }),
          maxWidth: defineItem<number>({
            title: preferencesText('maxWidth'),
            requiresReload: false,
            visible: true,
            defaultValue: 1200,
            parser: {
              type: 'number',
              min: 100,
              max: 10_000,
            },
          }),
        },
      },
      // FIXME: integrate forms with these prefs:
      appearance: {
        title: preferencesText('appearance'),
        items: {
          fieldBackground: defineItem({
            title: preferencesText('fieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          disabledFieldBackground: defineItem({
            title: preferencesText('disabledFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          invalidFieldBackground: defineItem({
            title: preferencesText('invalidFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          requiredFieldBackground: defineItem({
            title: preferencesText('requiredFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          darkFieldBackground: defineItem({
            title: preferencesText('darkFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          darkDisabledFieldBackground: defineItem({
            title: preferencesText('darkDisabledFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          darkInvalidFieldBackground: defineItem({
            title: preferencesText('darkInvalidFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          darkRequiredFieldBackground: defineItem({
            title: preferencesText('darkRequiredFieldBackground'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
      queryComboBox: {
        title: preferencesText('queryComboBox'),
        items: {
          searchAlgorithm: defineItem<'startsWith' | 'contains'>({
            title: preferencesText('searchAlgorithm'),
            requiresReload: false,
            visible: true,
            defaultValue: 'startsWith',
            values: [
              {
                value: 'startsWith',
                title: preferencesText('startsWith'),
                description: preferencesText('startsWithDescription'),
              },
              {
                value: 'contains',
                title: preferencesText('contains'),
                description: preferencesText('containsDescription'),
              },
            ],
          }),
          highlightMatch: defineItem<boolean>({
            title: preferencesText('highlightMatch'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  chooseCollection: {
    title: commonText('chooseCollection'),
    subCategories: {
      general: {
        title: preferencesText('general'),
        items: {
          alwaysPrompt: defineItem<boolean>({
            title: preferencesText('alwaysPrompt'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
          sortOrder: defineItem<
            keyof Collection['fields'] | `-${keyof Collection['fields']}`
          >({
            title: formsText('order'),
            requiresReload: false,
            visible: true,
            defaultValue: 'collectionName',
            renderer: CollectionSortOrderPreferenceItem,
          }),
        },
      },
    },
  },
  // FIXME: integrate with these:
  treeEditor: {
    title: preferencesText('treeEditor'),
    subCategories: {
      geography: {
        /*
         * This would be replaced with the label from the schema once
         * schema is laoded
         */
        title: '_Geography',
        items: {
          evenColumnColor: defineItem({
            title: preferencesText('evenColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          oddColumnColor: defineItem({
            title: preferencesText('oddColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          synonomyColor: defineItem({
            title: preferencesText('synonomyColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
      taxon: {
        title: '_Taxon',
        items: {
          evenColumnColor: defineItem({
            title: preferencesText('evenColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          oddColumnColor: defineItem({
            title: preferencesText('oddColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          synonomyColor: defineItem({
            title: preferencesText('synonomyColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
      storage: {
        title: '_Storage',
        items: {
          evenColumnColor: defineItem({
            title: preferencesText('evenColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          oddColumnColor: defineItem({
            title: preferencesText('oddColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          synonomyColor: defineItem({
            title: preferencesText('synonomyColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
      geologicTimePeriod: {
        title: '_GeologicTimePeriod',
        items: {
          evenColumnColor: defineItem({
            title: preferencesText('evenColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          oddColumnColor: defineItem({
            title: preferencesText('oddColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          synonomyColor: defineItem({
            title: preferencesText('synonomyColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
      lithoStrat: {
        title: '_LithoStrat',
        items: {
          evenColumnColor: defineItem({
            title: preferencesText('evenColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          oddColumnColor: defineItem({
            title: preferencesText('oddColumnColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
          synonomyColor: defineItem({
            title: preferencesText('synonomyColor'),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
          }),
        },
      },
    },
  },
  workBench: {
    title: commonText('workBench'),
    subCategories: {
      wbPlanView: {
        title: wbText('dataMapper'),
        items: {
          showNewDataSetWarning: defineItem<boolean>({
            title: preferencesText('showNewDataSetWarning'),
            description: preferencesText('showNewDataSetWarningDescription'),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            parser: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
} as const;

// Use tree table labels as titles for the tree editor sections
import('./schema')
  .then(async ({ fetchContext, schema }) =>
    fetchContext.then(() => {
      const trees = preferenceDefinitions.treeEditor.subCategories;
      // @ts-expect-error Assigning to read-only
      trees.geography.title = schema.models.Geography.label;
      // @ts-expect-error Assigning to read-only
      trees.taxon.title = schema.models.Taxon.label;
      // @ts-expect-error Assigning to read-only
      trees.storage.title = schema.models.Storage.label;
      // @ts-expect-error Assigning to read-only
      trees.geologicTimePeriod.title = schema.models.GeologicTimePeriod.label;
      // @ts-expect-error Assigning to read-only
      trees.lithoStrat.title = schema.models.LithoStrat.label;
    })
  )
  .catch(crash);

export type Preferences = GenericPreferencesCategories &
  typeof preferenceDefinitions;

ensure<GenericPreferencesCategories>()(preferenceDefinitions);
