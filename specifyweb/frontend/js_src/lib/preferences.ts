/**
 * Definitions for User Interface preferences (scoped to a SpecifyUser)
 */

import {
  handleLanguageChange,
  LanguagePreferencesItem,
} from './components/toolbar/language';
import { commonText } from './localization/common';
import { preferencesText } from './localization/preferences';
import type { Language } from './localization/utils';
import { DEFAULT_LANGUAGE, languages } from './localization/utils';
import { wbText } from './localization/workbench';
import type { IR, RA } from './types';
import { ensure } from './types';
import type { Parser } from './uiparse';
import { formatter, validators } from './uiparse';

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
   */
  readonly visible: boolean;
  readonly defaultValue: VALUE;
  // Custom onChange handler
  readonly onChange?: (value: VALUE) => void | Promise<void>;
  readonly renderer?: PreferenceItemComponent<VALUE>;
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
      readonly parser: Parser;
    }
);

const defineItem = <VALUE>(
  definition: PreferenceItem<VALUE>
): PreferenceItem<VALUE> => definition;

export type GenericPreferencesCategories = IR<{
  readonly title: string;
  readonly description?: string;
  readonly subCategories: IR<{
    // If title matches category title, the subcategory title is hidden
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
            title: commonText('language'),
            requiresReload: true,
            // TODO: add ability to make pref visible only to admins
            visible: true,
            defaultValue: DEFAULT_LANGUAGE,
            onChange: handleLanguageChange,
            values: languages,
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
        },
      },
      schema: {
        title: commonText('schemaConfig'),
        items: {
          // TODO: make schema language independent from UI language
          language: defineItem<Language>({
            title: commonText('language'),
            requiresReload: true,
            visible: true,
            defaultValue: DEFAULT_LANGUAGE,
            onChange: handleLanguageChange,
            values: languages,
            renderer: LanguagePreferencesItem,
          }),
        },
      },
    },
  },
  workBench: {
    title: commonText('workbench'),
    subCategories: {
      wbPlanView: {
        title: wbText('dataMapper'),
        items: {
          showHiddenTables: defineItem<boolean>({
            title: wbText('showAdvancedTables'),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            parser: {
              type: 'checkbox',
            },
          }),
          showHiddenFields: defineItem<boolean>({
            title: wbText('revealHiddenFormFields'),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            parser: {
              type: 'checkbox',
            },
          }),
          showMappingView: defineItem<boolean>({
            title: wbText('showMappingEditor'),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            parser: {
              type: 'checkbox',
            },
          }),
          mappingViewHeight: defineItem<number>({
            title: '',
            requiresReload: false,
            visible: false,
            defaultValue: 300,
            parser: {
              type: 'number',
              min: 0,
              step: 1,
              formatters: [formatter().int],
              validators: [validators.number],
            },
          }),
        },
      },
    },
  },
} as const;

export type Preferences = GenericPreferencesCategories &
  typeof preferenceDefinitions;

ensure<GenericPreferencesCategories>()(preferenceDefinitions);
