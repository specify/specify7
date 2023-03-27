/**
 * Definitions for User Interface preferences (scoped to a SpecifyUser)
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { headerText } from '../../localization/header';
import { interactionsText } from '../../localization/interactions';
import { localityText } from '../../localization/locality';
import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { reportsText } from '../../localization/report';
import { resourcesText } from '../../localization/resources';
import { schemaText } from '../../localization/schema';
import { statsText } from '../../localization/stats';
import type { Language } from '../../localization/utils/config';
import { LANGUAGE } from '../../localization/utils/config';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import type { Parser } from '../../utils/parser/definitions';
import type { IR, RA, RR } from '../../utils/types';
import { defined, ensure, overwriteReadOnly } from '../../utils/types';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import type { TableFields } from '../DataModel/helperTypes';
import type { JavaType } from '../DataModel/specifyField';
import type { Collection, Tables } from '../DataModel/types';
import { error, softError } from '../Errors/assert';
import type { StatLayout } from '../Statistics/types';
import {
  LanguagePreferencesItem,
  SchemaLanguagePreferenceItem,
} from '../Toolbar/Language';
import type { MenuPreferences, WelcomePageMode } from './Renderers';
import {
  CollectionSortOrderPreferenceItem,
  ColorPickerPreferenceItem,
  defaultFont,
  FontFamilyPreferenceItem,
  HeaderItemsPreferenceItem,
  WelcomePageModePreferenceItem,
} from './Renderers';

// Custom Renderer for a preference item
export type PreferenceItemComponent<VALUE> = (props: {
  readonly category: string;
  readonly subcategory: string;
  readonly item: string;
  readonly definition: PreferenceItem<VALUE>;
  readonly value: VALUE;
  readonly onChange: (value: VALUE) => void;
  readonly isReadOnly: boolean;
}) => JSX.Element;

/**
 * Represents a single preference option
 *
 * The concept seems similar to the "Feature Gates" in Firefox:
 * https://firefox-source-docs.mozilla.org/toolkit/components/featuregates/featuregates/
 */
export type PreferenceItem<VALUE> = {
  readonly title: JSX.Element | LocalizedString;
  readonly description?: JSX.Element | LocalizedString;
  // Whether the page needs to be reloaded for this preference to apply
  readonly requiresReload: boolean;
  /*
   * Set value only on field blur, rather than as soon as the user changed it.
   * Fixes https://github.com/specify/specify7/issues/1555
   */
  readonly setOnBlurOnly?: boolean;
  /*
   * Whether to render this item in the Preferences Menu
   * Invisible items are usually set by components outside the preferences menu
   *
   * If 'protected' then visible, but editable only if user has
   * `Preferences -> Edit Protected` permission
   */
  readonly visible: boolean | 'protected';
  readonly defaultValue: VALUE;
} & (
  | {
      // Parses the stored value. Determines the input type to render
      readonly type: JavaType;
      readonly parser?: Parser;
    }
  | {
      readonly renderer: PreferenceItemComponent<VALUE>;
      /**
       * Use "label" if renderer displays only a single interactive element
       * Otherwise, use "div"
       */
      readonly container: 'div' | 'label';
    }
  | {
      readonly values:
        | RA<{
            readonly value: VALUE;
            readonly title?: LocalizedString;
            readonly description?: LocalizedString;
          }>
        | RA<VALUE>;
    }
);

const altKeyName = globalThis.navigator?.appVersion.includes('Mac')
  ? 'Option'
  : 'Alt';

/**
 * This is used to enforce the same generic value be used inside a PreferenceItem
 */
export const defineItem = <VALUE,>(
  definition: PreferenceItem<VALUE>
): PreferenceItem<VALUE> => definition;

export type GenericPreferences = IR<{
  readonly title: LocalizedString;
  readonly description?: LocalizedString;
  readonly subCategories: IR<{
    readonly title: LocalizedString;
    readonly description?: LocalizedString;
    readonly items: IR<PreferenceItem<any>>;
  }>;
}>;
export const userPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      ui: {
        title: preferencesText.ui(),
        items: {
          language: defineItem<Language>({
            title: commonText.language(),
            requiresReload: true,
            visible: true,
            defaultValue: LANGUAGE,
            renderer: LanguagePreferencesItem,
            container: 'label',
          }),
          theme: defineItem<'dark' | 'light' | 'system'>({
            title: preferencesText.theme(),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText.useSystemSetting(),
                description: preferencesText.inheritOsSettings(),
              },
              {
                value: 'light',
                title: preferencesText.light(),
              },
              {
                value: 'dark',
                title: preferencesText.dark(),
              },
            ],
          }),
          reduceMotion: defineItem<'noPreference' | 'reduce' | 'system'>({
            title: preferencesText.reduceMotion(),
            description: preferencesText.reduceMotionDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText.useSystemSetting(),
                description: preferencesText.inheritOsSettings(),
              },
              {
                value: 'reduce',
                title: preferencesText.reduce(),
              },
              {
                value: 'noPreference',
                title: preferencesText.noPreference(),
              },
            ],
          }),
          reduceTransparency: defineItem<'noPreference' | 'reduce' | 'system'>({
            title: preferencesText.reduceTransparency(),
            description: preferencesText.reduceTransparencyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText.useSystemSetting(),
                description: preferencesText.inheritOsSettings(),
              },
              {
                value: 'reduce',
                title: preferencesText.reduce(),
              },
              {
                value: 'noPreference',
                title: preferencesText.noPreference(),
              },
            ],
          }),
          contrast: defineItem<'less' | 'more' | 'noPreference' | 'system'>({
            title: preferencesText.contrast(),
            requiresReload: false,
            visible: true,
            defaultValue: 'system',
            values: [
              {
                value: 'system',
                title: preferencesText.useSystemSetting(),
                description: preferencesText.inheritOsSettings(),
              },
              {
                value: 'more',
                title: preferencesText.increase(),
              },
              {
                value: 'less',
                title: preferencesText.reduce(),
              },
              {
                value: 'noPreference',
                title: preferencesText.noPreference(),
              },
            ],
          }),
          fontSize: defineItem<number>({
            title: preferencesText.fontSize(),
            requiresReload: false,
            setOnBlurOnly: true,
            visible: true,
            defaultValue: 100,
            type: 'java.lang.Double',
            parser: {
              min: 1,
              max: 1000,
            },
          }),
          scaleInterface: defineItem<boolean>({
            title: preferencesText.scaleInterface(),
            description: preferencesText.scaleInterfaceDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          fontFamily: defineItem<string>({
            title: preferencesText.fontFamily(),
            description: preferencesText.fontFamilyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
            container: 'label',
          }),
          useCustomTooltips: defineItem<boolean>({
            title: preferencesText.useCustomTooltips(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      appearance: {
        title: preferencesText.appearance(),
        items: {
          background: defineItem({
            title: preferencesText.background(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkBackground: defineItem({
            title: preferencesText.darkBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor1: defineItem({
            title: preferencesText.accentColor1(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffcda3',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor2: defineItem({
            title: preferencesText.accentColor2(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ff9742',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor3: defineItem({
            title: preferencesText.accentColor3(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ff811a',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor4: defineItem({
            title: preferencesText.accentColor4(),
            requiresReload: false,
            visible: true,
            defaultValue: '#d15e00',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor5: defineItem({
            title: preferencesText.accentColor5(),
            requiresReload: false,
            visible: true,
            defaultValue: '#703200',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          roundedCorners: defineItem<boolean>({
            title: preferencesText.roundedCorners(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      application: {
        title: preferencesText.application(),
        items: {
          allowDismissingErrors: defineItem<boolean>({
            title: preferencesText.allowDismissingErrors(),
            requiresReload: false,
            visible: 'protected',
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      dialog: {
        title: preferencesText.dialogs(),
        items: {
          updatePageTitle: defineItem<boolean>({
            title: preferencesText.updatePageTitle(),
            description: preferencesText.updatePageTitleDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          transparentBackground: defineItem<boolean>({
            title: preferencesText.translucentDialog(),
            description: preferencesText.translucentDialogDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          blurContentBehindDialog: defineItem<boolean>({
            title: preferencesText.blurContentBehindDialog(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showIcon: defineItem<boolean>({
            title: preferencesText.showDialogIcon(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closeOnEsc: defineItem<boolean>({
            title: preferencesText.closeOnEsc(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closeOnOutsideClick: defineItem<boolean>({
            title: preferencesText.closeOnOutsideClick(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rememberPosition: defineItem<boolean>({
            title: preferencesText.rememberDialogPositions(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rememberSize: defineItem<boolean>({
            title: preferencesText.rememberDialogSizes(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      behavior: {
        title: preferencesText.behavior(),
        items: {
          altClickToSupressNewTab: defineItem<boolean>({
            title: preferencesText.altClickToSupressNewTab({ altKeyName }),
            description: preferencesText.altClickToSupressNewTabDescription({
              altKeyName,
            }),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          unsavedIndicator: defineItem<boolean>({
            title: preferencesText.showUnsavedIndicator(),
            description: preferencesText.showUnsavedIndicatorDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  welcomePage: {
    title: preferencesText.welcomePage(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          mode: defineItem<WelcomePageMode>({
            title: preferencesText.content(),
            description: (
              <Link.NewTab href="https://github.com/specify/specify7/wiki/Customizing-the-splash-screen">
                {headerText.documentation()}
              </Link.NewTab>
            ),
            requiresReload: false,
            visible: true,
            defaultValue: 'default',
            renderer: WelcomePageModePreferenceItem,
            container: 'div',
          }),
          source: defineItem<string>({
            title: <></>,
            requiresReload: false,
            // This item is rendered inside of WelcomePageModePreferenceItem
            visible: false,
            defaultValue: '',
            type: 'text',
          }),
        },
      },
    },
  },
  header: {
    title: preferencesText.header(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          position: defineItem<'bottom' | 'left' | 'right' | 'top'>({
            title: preferencesText.position(),
            requiresReload: false,
            visible: true,
            defaultValue: 'left',
            values: [
              { value: 'left', title: preferencesText.left() },
              { value: 'top', title: preferencesText.top() },
              { value: 'right', title: preferencesText.right() },
              { value: 'bottom', title: preferencesText.bottom() },
            ],
          }),
          items: defineItem<MenuPreferences>({
            title: preferencesText.position(),
            requiresReload: false,
            visible: true,
            defaultValue: {
              visible: [],
              hidden: [],
            },
            renderer: HeaderItemsPreferenceItem,
            container: 'div',
          }),
        },
      },
    },
  },
  interactions: {
    title: interactionsText.interactions(),
    subCategories: {
      createInteractions: {
        title: preferencesText.createInteractions(),
        items: {
          useSpaceAsDelimiter: defineItem<'auto' | 'false' | 'true'>({
            title: preferencesText.useSpaceAsDelimiter(),
            requiresReload: false,
            visible: true,
            defaultValue: 'auto',
            values: [
              {
                value: 'auto',
                title: wbText.determineAutomatically(),
                description: preferencesText.detectAutomaticallyDescription(),
              },
              {
                value: 'true',
                title: preferencesText.use(),
              },
              {
                value: 'false',
                title: preferencesText.dontUse(),
              },
            ],
          }),
          useCommaAsDelimiter: defineItem<'auto' | 'false' | 'true'>({
            title: preferencesText.useCommaAsDelimiter(),
            requiresReload: false,
            visible: true,
            defaultValue: 'auto',
            values: [
              {
                value: 'auto',
                title: wbText.determineAutomatically(),
                description: preferencesText.detectAutomaticallyDescription(),
              },
              {
                value: 'true',
                title: preferencesText.use(),
              },
              {
                value: 'false',
                title: preferencesText.dontUse(),
              },
            ],
          }),
          useNewLineAsDelimiter: defineItem<'auto' | 'false' | 'true'>({
            title: preferencesText.useNewLineAsDelimiter(),
            requiresReload: false,
            visible: true,
            defaultValue: 'auto',
            values: [
              {
                value: 'auto',
                title: wbText.determineAutomatically(),
                description: preferencesText.detectAutomaticallyDescription(),
              },
              {
                value: 'true',
                title: preferencesText.use(),
              },
              {
                value: 'false',
                title: preferencesText.dontUse(),
              },
            ],
          }),
          useCustomDelimiters: defineItem<string>({
            title: preferencesText.useCustomDelimiters(),
            description: preferencesText.useCustomDelimitersDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: '',
            type: 'text',
          }),
        },
      },
    },
  },
  form: {
    title: formsText.forms(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          shownTables: defineItem<RA<number> | 'legacy'>({
            title: <>_shownTables</>,
            requiresReload: false,
            visible: false,
            defaultValue: 'legacy',
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
        },
      },
      schema: {
        title: schemaText.schemaConfig(),
        items: {
          language: defineItem<string>({
            title: commonText.language(),
            description: preferencesText.languageDescription(),
            requiresReload: true,
            visible: true,
            defaultValue: 'en',
            renderer: SchemaLanguagePreferenceItem,
            container: 'label',
          }),
        },
      },
      behavior: {
        title: preferencesText.behavior(),
        items: {
          textAreaAutoGrow: defineItem<boolean>({
            title: preferencesText.textAreaAutoGrow(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          updatePageTitle: defineItem<boolean>({
            title: preferencesText.updatePageTitle(),
            description: preferencesText.updatePageTitleFormDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          tableNameInTitle: defineItem<boolean>({
            title: preferencesText.tableNameInTitle(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          formHeaderFormat: defineItem<'full' | 'icon' | 'name'>({
            title: preferencesText.formHeaderFormat(),
            requiresReload: false,
            visible: true,
            defaultValue: 'full',
            values: [
              {
                value: 'full',
                title: preferencesText.iconAndTableName(),
              },
              {
                value: 'name',
                title: schemaText.tableName(),
              },
              {
                value: 'icon',
                title: preferencesText.tableIcon(),
              },
            ],
          }),
          makeFormDialogsModal: defineItem<boolean>({
            title: preferencesText.makeFormDialogsModal(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      definition: {
        title: resourcesText.formDefinition(),
        items: {
          flexibleColumnWidth: defineItem<boolean>({
            title: preferencesText.flexibleColumnWidth(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          flexibleSubGridColumnWidth: defineItem<boolean>({
            title: preferencesText.flexibleSubGridColumnWidth(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      ui: {
        title: preferencesText.ui(),
        items: {
          fontSize: defineItem<number>({
            title: preferencesText.fontSize(),
            requiresReload: false,
            setOnBlurOnly: true,
            visible: true,
            defaultValue: 100,
            type: 'java.lang.Float',
            parser: {
              min: 1,
              max: 1000,
            },
          }),
          fontFamily: defineItem<string>({
            title: preferencesText.fontFamily(),
            description: preferencesText.fontFamilyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
            container: 'label',
          }),
          maxWidth: defineItem<number>({
            title: preferencesText.maxFormWidth(),
            requiresReload: false,
            setOnBlurOnly: true,
            visible: true,
            defaultValue: 1200,
            type: 'java.lang.Float',
            parser: {
              min: 100,
              max: 10_000,
            },
          }),
          limitMaxFieldWidth: defineItem<boolean>({
            title: preferencesText.limitMaxFieldWidth(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          specifyNetworkBadge: defineItem<boolean>({
            title: preferencesText.specifyNetworkBadge(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          useAccessibleFullDatePicker: defineItem<boolean>({
            title: preferencesText.useAccessibleFullDatePicker(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          useAccessibleMonthPicker: defineItem<boolean>({
            title: preferencesText.useAccessibleMonthPicker(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rightAlignNumberFields: defineItem<boolean>({
            title: preferencesText.rightAlignNumberFields(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      fieldBackground: {
        title: preferencesText.fieldBackgrounds(),
        items: {
          default: defineItem({
            title: preferencesText.fieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#e5e7eb',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          disabled: defineItem({
            title: preferencesText.disabledFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          invalid: defineItem({
            title: preferencesText.invalidFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f87171',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          required: defineItem({
            title: preferencesText.requiredFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#bfdbfe',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkDefault: defineItem({
            title: preferencesText.darkFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#404040',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkDisabled: defineItem({
            title: preferencesText.darkDisabledFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkInvalid: defineItem({
            title: preferencesText.darkInvalidFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#991b1b',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkRequired: defineItem({
            title: preferencesText.darkRequiredFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#1e3a8a',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      appearance: {
        title: preferencesText.appearance(),
        items: {
          foreground: defineItem({
            title: preferencesText.foreground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          background: defineItem({
            title: preferencesText.background(),
            requiresReload: false,
            visible: true,
            defaultValue: '#e5e7eb',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkForeground: defineItem({
            title: preferencesText.darkForeground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkBackground: defineItem({
            title: preferencesText.darkBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#262626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      autoComplete: {
        title: preferencesText.autoComplete(),
        items: {
          searchAlgorithm: defineItem<
            | 'contains'
            | 'containsCaseSensitive'
            | 'startsWith'
            | 'startsWithCaseSensitive'
          >({
            title: preferencesText.searchAlgorithm(),
            requiresReload: false,
            visible: true,
            defaultValue: 'startsWith',
            values: [
              {
                value: 'startsWith',
                title: preferencesText.startsWithInsensitive(),
                description: preferencesText.startsWithDescription(),
              },
              {
                value: 'startsWithCaseSensitive',
                title: preferencesText.startsWithCaseSensitive(),
                description:
                  preferencesText.startsWithCaseSensitiveDescription(),
              },
              {
                value: 'contains',
                title: preferencesText.containsInsensitive(),
                description: preferencesText.containsDescription(),
              },
              {
                value: 'containsCaseSensitive',
                title: preferencesText.containsCaseSensitive(),
                description: preferencesText.containsCaseSensitiveDescription(),
              },
            ],
          }),
          highlightMatch: defineItem<boolean>({
            title: preferencesText.highlightMatch(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          autoGrowAutoComplete: defineItem<boolean>({
            title: preferencesText.autoGrowAutoComplete(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      queryComboBox: {
        title: preferencesText.queryComboBox(),
        items: {
          searchAlgorithm: defineItem<'contains' | 'startsWith'>({
            title: preferencesText.searchAlgorithm(),
            requiresReload: false,
            visible: true,
            defaultValue: 'startsWith',
            values: [
              {
                value: 'startsWith',
                title: preferencesText.startsWithInsensitive(),
                description: preferencesText.startsWithDescription(),
              },
              {
                value: 'contains',
                title: preferencesText.containsInsensitive(),
                description:
                  `${preferencesText.containsDescription()} ${preferencesText.containsSecondDescription()}` as LocalizedString,
              },
            ],
          }),
          treeSearchAlgorithm: defineItem<'contains' | 'startsWith'>({
            title: preferencesText.treeSearchAlgorithm(),
            requiresReload: false,
            visible: true,
            defaultValue: 'contains',
            values: [
              {
                value: 'startsWith',
                title: preferencesText.startsWithInsensitive(),
                description: preferencesText.startsWithDescription(),
              },
              {
                value: 'contains',
                title: preferencesText.containsInsensitive(),
                description:
                  `${preferencesText.containsDescription()} ${preferencesText.containsSecondDescription()}` as LocalizedString,
              },
            ],
          }),
        },
      },
      recordSet: {
        title: '_recordSet' as LocalizedString,
        items: {
          recordToOpen: defineItem<'first' | 'last'>({
            title: preferencesText.recordSetRecordToOpen(),
            requiresReload: false,
            visible: true,
            defaultValue: 'first',
            // REFACTOR: define pick list values as IR<> instead of RA<>
            values: [
              {
                value: 'first',
                title: formsText.firstRecord(),
              },
              {
                value: 'last',
                title: formsText.lastRecord(),
              },
            ],
          }),
        },
      },
      formTable: {
        title: formsText.formTable(),
        items: {
          maxHeight: defineItem<number>({
            title: preferencesText.maxHeight(),
            requiresReload: false,
            visible: true,
            defaultValue: 600,
            type: 'java.lang.Integer',
            parser: {
              min: 100,
            },
          }),
        },
      },
      /*
       * The items in this category are edited though the form preferences menu
       * on forms
       */
      preferences: {
        title: '(not visible to user) Preferences' as LocalizedString,
        items: {
          /*
           * This has to be an object rather than an array to allow forms to
           * override this value when this value is undefined for a given table
           */
          printOnSave: defineItem<Partial<RR<keyof Tables, boolean>>>({
            title: <>Generate label on form save</>,
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          carryForward: defineItem<{
            readonly [TABLE_NAME in keyof Tables]?: RA<
              TableFields<Tables[TABLE_NAME]>
            >;
          }>({
            title: <>carryForward</>,
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          enableCarryForward: defineItem<RA<keyof Tables>>({
            title: <>enableCarryForward</>,
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          /*
           * Can temporary disable clone for a given table
           * Since most tables are likely to have carry enabled, this pref is
           * negated (so as not waste too much space)
           */
          disableClone: defineItem<RA<keyof Tables>>({
            title: <>disableClone</>,
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          disableAdd: defineItem<RA<keyof Tables>>({
            title: <>disableAdd</>,
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          autoNumbering: defineItem<{
            readonly [TABLE_NAME in keyof Tables]?: RA<
              TableFields<Tables[TABLE_NAME]>
            >;
          }>({
            title: <>autoNumbering</>,
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          useCustomForm: defineItem<RA<keyof Tables>>({
            title: <>useCustomForm</>,
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
          carryForwardShowHidden: defineItem<boolean>({
            title: <>carryForwardShowHidden</>,
            requiresReload: false,
            visible: false,
            defaultValue: false,
            type: 'java.lang.Boolean',
            container: 'div',
          }),
        },
      },
    },
  },
  chooseCollection: {
    title: commonText.chooseCollection(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          alwaysPrompt: defineItem<boolean>({
            title: preferencesText.alwaysPrompt(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          sortOrder: defineItem<
            keyof Collection['fields'] | `-${keyof Collection['fields']}`
          >({
            title: attachmentsText.orderBy(),
            description: preferencesText.collectionSortOrderDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'collectionName',
            renderer: CollectionSortOrderPreferenceItem,
            container: 'label',
          }),
        },
      },
    },
  },
  attachments: {
    title: attachmentsText.attachments(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          autoPlay: defineItem<boolean>({
            title: preferencesText.autoPlayMedia(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  treeEditor: {
    title: preferencesText.treeEditor(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          autoScroll: defineItem<boolean>({
            title: preferencesText.autoScrollTree(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          searchCaseSensitive: defineItem<boolean>({
            title: preferencesText.searchCaseSensitive(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          searchField: defineItem<'fullName' | 'name'>({
            title: preferencesText.searchField(),
            requiresReload: false,
            visible: true,
            defaultValue: 'name',
            values: [
              {
                value: 'name',
                // Replaced with localized version once schema is loaded
                title: '_name' as LocalizedString,
              },
              {
                value: 'fullName',
                // Replaced with localized version once schema is loaded
                title: '_fullName' as LocalizedString,
              },
            ],
          }),
          searchAlgorithm: defineItem<'contains' | 'startsWith'>({
            title: preferencesText.searchAlgorithm(),
            requiresReload: false,
            visible: true,
            defaultValue: 'startsWith',
            values: [
              {
                value: 'startsWith',
                title: queryText.startsWith(),
              },
              {
                value: 'contains',
                title: queryText.contains(),
              },
            ],
          }),
        },
      },
      geography: {
        /*
         * This would be replaced with labels from schema once
         * schema is loaded
         */
        title: '_Geography' as LocalizedString,
        items: {
          treeAccentColor: defineItem({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: defineItem({
            title: preferencesText.synonymColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#dc2626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      taxon: {
        title: '_Taxon' as LocalizedString,
        items: {
          treeAccentColor: defineItem({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: defineItem({
            title: preferencesText.synonymColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#dc2626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      storage: {
        title: '_Storage' as LocalizedString,
        items: {
          treeAccentColor: defineItem({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: defineItem({
            title: preferencesText.synonymColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#dc2626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      geologicTimePeriod: {
        title: '_GeologicTimePeriod' as LocalizedString,
        items: {
          treeAccentColor: defineItem({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: defineItem({
            title: preferencesText.synonymColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#dc2626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      lithoStrat: {
        title: '_LithoStrat' as LocalizedString,
        items: {
          treeAccentColor: defineItem({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: defineItem({
            title: preferencesText.synonymColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#dc2626',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
    },
  },
  queryBuilder: {
    title: queryText.queryBuilder(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          noRestrictionsMode: defineItem<boolean>({
            title: preferencesText.noRestrictionsMode(),
            description: (
              <span>
                {preferencesText.noRestrictionsModeQueryDescription()}
                <br />
                <span className="text-red-500">
                  {preferencesText.noRestrictionsModeWarning()}
                </span>
              </span>
            ),
            requiresReload: false,
            visible: 'protected',
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showNoReadTables: defineItem<boolean>({
            title: preferencesText.showNoReadTables(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          shownTables: defineItem<RA<number>>({
            title: <>_shownTables</>,
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
        },
      },
      behavior: {
        title: preferencesText.behavior(),
        items: {
          stickyScrolling: defineItem<boolean>({
            title: preferencesText.stickyScrolling(),
            requiresReload: false,
            visible: true,
            /**
             * This used to be checked by default but was temporary disabled
             * because of https://github.com/specify/specify7/issues/1719.
             * BUG: Need to reEnable after that issue is fixed
             */
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          exportFileDelimiter: defineItem<' ' | ',' | ';' | '\t' | '|'>({
            title: preferencesText.exportFileDelimiter(),
            requiresReload: false,
            visible: true,
            defaultValue: ',',
            values: [
              {
                value: ',',
                title: wbText.comma(),
              },
              {
                value: '\t',
                title: wbText.tab(),
              },
              {
                value: ';',
                title: wbText.semicolon(),
              },
              {
                value: ' ',
                title: wbText.space(),
              },
              {
                value: '|',
                title: wbText.pipe(),
              },
            ],
          }),
        },
      },
      appearance: {
        title: preferencesText.appearance(),
        items: {
          condenseQueryResults: defineItem<boolean>({
            title: preferencesText.condenseQueryResults(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  reports: {
    title: reportsText.reports(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          clearQueryFilters: defineItem<boolean>({
            title: preferencesText.clearQueryFilters(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  workBench: {
    title: wbText.workBench(),
    subCategories: {
      editor: {
        title: preferencesText.spreadsheet(),
        items: {
          minSpareRows: defineItem<number>({
            title: preferencesText.minSpareRows(),
            requiresReload: false,
            visible: true,
            defaultValue: 1,
            type: 'java.lang.Integer',
            parser: {
              min: 0,
              max: 100,
            },
          }),
          autoWrapCol: defineItem<boolean>({
            title: preferencesText.autoWrapCols(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          autoWrapRow: defineItem<boolean>({
            title: preferencesText.autoWrapRows(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          tabMoveDirection: defineItem<'col' | 'row'>({
            title: preferencesText.tabMoveDirection(),
            description: preferencesText.tabMoveDirectionDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'col',
            values: [
              {
                value: 'col',
                title: preferencesText.column(),
              },
              {
                value: 'row',
                title: preferencesText.row(),
              },
            ],
          }),
          enterMoveDirection: defineItem<'col' | 'row'>({
            title: preferencesText.enterMoveDirection(),
            description: preferencesText.enterMoveDirectionDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: 'row',
            values: [
              {
                value: 'col',
                title: preferencesText.column(),
              },
              {
                value: 'row',
                title: preferencesText.row(),
              },
            ],
          }),
          enterBeginsEditing: defineItem<boolean>({
            title: preferencesText.enterBeginsEditing(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          filterPickLists: defineItem<
            'case-insensitive' | 'case-sensitive' | 'none'
          >({
            title: preferencesText.filterPickLists(),
            requiresReload: false,
            visible: true,
            defaultValue: 'none',
            values: [
              {
                value: 'none',
                title: commonText.no(),
              },
              {
                value: 'case-sensitive',
                title: preferencesText.caseSensitive(),
              },
              {
                value: 'case-insensitive',
                title: preferencesText.caseInsensitive(),
              },
            ],
          }),
          exportFileDelimiter: defineItem<' ' | ',' | ';' | '\t' | '|'>({
            title: preferencesText.exportFileDelimiter(),
            requiresReload: false,
            visible: true,
            defaultValue: '\t',
            values: [
              {
                value: ',',
                title: wbText.comma(),
              },
              {
                value: '\t',
                title: wbText.tab(),
              },
              {
                value: ';',
                title: wbText.semicolon(),
              },
              {
                value: ' ',
                title: wbText.space(),
              },
              {
                value: '|',
                title: wbText.pipe(),
              },
            ],
          }),
        },
      },
      wbPlanView: {
        title: wbPlanText.dataMapper(),
        items: {
          showNewDataSetWarning: defineItem<boolean>({
            title: preferencesText.showNewDataSetWarning(),
            description: preferencesText.showNewDataSetWarningDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          noRestrictionsMode: defineItem<boolean>({
            title: preferencesText.noRestrictionsMode(),
            description: (
              <span>
                {preferencesText.noRestrictionsModeWbDescription()}
                <br />
                <span className="text-red-500">
                  {preferencesText.noRestrictionsModeWarning()}
                </span>
              </span>
            ),
            requiresReload: false,
            visible: 'protected',
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showNoAccessTables: defineItem<boolean>({
            title: preferencesText.showNoAccessTables(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  appResources: {
    title: resourcesText.appResources(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          lineWrap: defineItem<boolean>({
            title: preferencesText.lineWrap(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          indentSize: defineItem<number>({
            title: preferencesText.indentSize(),
            requiresReload: false,
            visible: true,
            defaultValue: 2,
            parser: {
              min: 1,
              max: 8,
              step: 1,
            },
            type: 'java.lang.Integer',
          }),
          indentWithTab: defineItem<boolean>({
            title: preferencesText.indentWithTab(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  statistics: {
    title: statsText.statistics(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          layout: defineItem<RA<StatLayout> | undefined>({
            title: 'Defines the layout of the stats page',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: () => <>{error('This should not get called')}</>,
            container: 'label',
          }),
        },
      },
    },
  },
  leaflet: {
    title: localityText.geoMap(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          doubleClickZoom: defineItem<boolean>({
            title: preferencesText.doubleClickZoom(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closePopupOnClick: defineItem<boolean>({
            title: preferencesText.closePopupOnClick(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          animateTransitions: defineItem<boolean>({
            title: preferencesText.animateTransitions(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          panInertia: defineItem<boolean>({
            title: preferencesText.panInertia(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          mouseDrags: defineItem<boolean>({
            title: preferencesText.mouseDrags(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          scrollWheelZoom: defineItem<boolean>({
            title: preferencesText.scrollWheelZoom(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
} as const;

// Use tree table labels as titles for the tree editor sections
import('../DataModel/schema')
  .then(async ({ fetchContext, schema }) =>
    fetchContext.then(() => {
      const trees = userPreferenceDefinitions.treeEditor.subCategories;
      overwriteReadOnly(
        trees.geography,
        'title',
        schema.models.Geography.label
      );
      overwriteReadOnly(trees.taxon, 'title', schema.models.Taxon.label);
      overwriteReadOnly(trees.storage, 'title', schema.models.Storage.label);
      overwriteReadOnly(
        trees.geologicTimePeriod,
        'title',
        schema.models.GeologicTimePeriod.label
      );
      overwriteReadOnly(
        trees.lithoStrat,
        'title',
        schema.models.LithoStrat.label
      );
      overwriteReadOnly(
        userPreferenceDefinitions.form.subCategories.recordSet,
        'title',
        schema.models.RecordSet.label
      );

      const treeSearchBehavior =
        userPreferenceDefinitions.treeEditor.subCategories.behavior.items
          .searchField;
      if ('values' in treeSearchBehavior) {
        const values = treeSearchBehavior.values as RA<{
          readonly value: string;
          readonly title: string;
        }>;
        const name = defined(
          values.find(
            (entry) => typeof entry === 'object' && entry.value === 'name'
          ),
          'Unable to find tree name value'
        );
        const fullName = defined(
          values.find(
            (entry) => typeof entry === 'object' && entry.value === 'fullName'
          ),
          'Unable to find tree full name value'
        );
        overwriteReadOnly(
          name,
          'title',
          getField(schema.models.Taxon, 'name').label
        );
        overwriteReadOnly(
          fullName,
          'title',
          getField(schema.models.Taxon, 'fullName').label
        );
      } else softError('Unable to replace the tree preferences item title');
    })
  )
  // Not using softFail here to avoid circular dependency
  .catch(console.error);

ensure<GenericPreferences>()(userPreferenceDefinitions);
