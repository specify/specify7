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
import { mergingText } from '../../localization/merging';
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
import { f } from '../../utils/functools';
import type { RA, RR } from '../../utils/types';
import {
  defined,
  ensure,
  localized,
  overwriteReadOnly,
} from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import type { TableFields } from '../DataModel/helperTypes';
import { genericTables } from '../DataModel/tables';
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
import type { GenericPreferences, PreferencesVisibilityContext } from './types';
import { definePref } from './types';

const isLightMode = ({
  isDarkMode,
  isRedirecting,
}: PreferencesVisibilityContext): boolean => !isDarkMode || isRedirecting;

const isDarkMode = ({
  isDarkMode,
  isRedirecting,
}: PreferencesVisibilityContext): boolean => isDarkMode || isRedirecting;

const altKeyName = globalThis.navigator?.appVersion.includes('Mac')
  ? 'Option'
  : 'Alt';

/**
 * Have to be careful as preferences may be used before schema is loaded
 */
const tableLabel = (tableName: keyof Tables): LocalizedString =>
  genericTables[tableName]?.label ?? camelToHuman(tableName);

export const userPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      ui: {
        title: preferencesText.ui(),
        items: {
          language: definePref<Language>({
            title: commonText.language(),
            requiresReload: true,
            visible: true,
            defaultValue: LANGUAGE,
            renderer: LanguagePreferencesItem,
            container: 'label',
          }),
          theme: definePref<'dark' | 'light' | 'system'>({
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
          sidebarTheme: definePref<'dark' | 'light'>({
            title: preferencesText.sidebarTheme(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: 'dark',
            values: [
              { value: 'dark', title: preferencesText.dark() },
              {
                value: 'light',
                title: preferencesText.light(),
              },
            ],
          }),
          reduceMotion: definePref<'noPreference' | 'reduce' | 'system'>({
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
          reduceTransparency: definePref<'noPreference' | 'reduce' | 'system'>({
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
          contrast: definePref<'less' | 'more' | 'noPreference' | 'system'>({
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
          fontSize: definePref<number>({
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
          scaleInterface: definePref<boolean>({
            title: preferencesText.scaleInterface(),
            description: preferencesText.scaleInterfaceDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          fontFamily: definePref<string>({
            title: preferencesText.fontFamily(),
            description: preferencesText.fontFamilyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
            container: 'label',
          }),
          useCustomTooltips: definePref<boolean>({
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
          background: definePref({
            title: preferencesText.background(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkBackground: definePref({
            title: preferencesText.darkBackground(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor1: definePref({
            title: preferencesText.accentColor1(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffcda3',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor2: definePref({
            title: preferencesText.accentColor2(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ff9742',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor3: definePref({
            title: preferencesText.accentColor3(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ff811a',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor4: definePref({
            title: preferencesText.accentColor4(),
            requiresReload: false,
            visible: true,
            defaultValue: '#d15e00',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          accentColor5: definePref({
            title: preferencesText.accentColor5(),
            requiresReload: false,
            visible: true,
            defaultValue: '#703200',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          roundedCorners: definePref<boolean>({
            title: preferencesText.roundedCorners(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
      buttonLight: {
        title: preferencesText.buttonsLight(),
        items: {
          saveButtonColor: definePref({
            title: preferencesText.saveButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#ff811a',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          dangerButtonColor: definePref({
            title: preferencesText.dangerButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#b91c1c',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          warningButtonColor: definePref({
            title: preferencesText.warningButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#f97316',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          infoButtonColor: definePref({
            title: preferencesText.infoButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#1d4ed8',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          successButtonColor: definePref({
            title: preferencesText.successButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#166534',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          secondaryButtonColor: definePref({
            title: preferencesText.secondaryButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#d1d5db',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          secondaryLightButtonColor: definePref({
            title: preferencesText.secondaryLightButtonColor(),
            requiresReload: false,
            visible: isLightMode,
            defaultValue: '#f5f5f5',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      buttonDark: {
        title: preferencesText.buttonsDark(),
        items: {
          saveButtonColor: definePref({
            title: preferencesText.saveButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#ff811a',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          dangerButtonColor: definePref({
            title: preferencesText.dangerButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#b91c1c',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          warningButtonColor: definePref({
            title: preferencesText.warningButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#f97316',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          infoButtonColor: definePref({
            title: preferencesText.infoButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#1d4ed8',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          successButtonColor: definePref({
            title: preferencesText.successButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#166534',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          secondaryButtonColor: definePref({
            title: preferencesText.secondaryButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#525252',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          secondaryLightButtonColor: definePref({
            title: preferencesText.secondaryLightButtonColor(),
            requiresReload: false,
            visible: isDarkMode,
            defaultValue: '#525252',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
        },
      },
      application: {
        title: preferencesText.application(),
        items: {
          allowDismissingErrors: definePref<boolean>({
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
          updatePageTitle: definePref<boolean>({
            title: preferencesText.updatePageTitle(),
            description: preferencesText.updatePageTitleDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          transparentBackground: definePref<boolean>({
            title: preferencesText.translucentDialog(),
            description: preferencesText.translucentDialogDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          blurContentBehindDialog: definePref<boolean>({
            title: preferencesText.blurContentBehindDialog(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showIcon: definePref<boolean>({
            title: preferencesText.showDialogIcon(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closeOnEsc: definePref<boolean>({
            title: preferencesText.closeOnEsc(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closeOnOutsideClick: definePref<boolean>({
            title: preferencesText.closeOnOutsideClick(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rememberPosition: definePref<boolean>({
            title: preferencesText.rememberDialogPositions(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rememberSize: definePref<boolean>({
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
          altClickToSupressNewTab: definePref<boolean>({
            title: preferencesText.altClickToSupressNewTab({ altKeyName }),
            description: preferencesText.altClickToSupressNewTabDescription({
              altKeyName,
            }),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          unsavedIndicator: definePref<boolean>({
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
          addSearchBar: definePref<boolean>({
            title: preferencesText.addSearchBarHomePage(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          mode: definePref<WelcomePageMode>({
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
          source: definePref<string>({
            // eslint-disable-next-line react/jsx-no-useless-fragment
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
          position: definePref<'bottom' | 'left' | 'right' | 'top'>({
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
          items: definePref<MenuPreferences>({
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
          customLogo: definePref<string>({
            title: preferencesText.customLogo(),
            requiresReload: false,
            visible: true,
            defaultValue: '',
            type: 'text',
            description: preferencesText.customLogoDescription(),
          }),
          customLogoCollapsed: definePref<string>({
            title: preferencesText.customLogoCollapsed(),
            requiresReload: false,
            visible: true,
            defaultValue: '',
            type: 'text',
          }),
        },
      },
    },
  },
  interactions: {
    title: interactionsText.interactions(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          shownTables: definePref<RA<number> | 'legacy'>({
            title: localized('_shownTables'),
            requiresReload: false,
            visible: false,
            defaultValue: 'legacy',
            renderer: () => <>{error('This should not get called')}</>,
            container: 'div',
          }),
        },
      },
      createInteractions: {
        title: preferencesText.createInteractions(),
        items: {
          useSpaceAsDelimiter: definePref<'auto' | 'false' | 'true'>({
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
          useCommaAsDelimiter: definePref<'auto' | 'false' | 'true'>({
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
          useNewLineAsDelimiter: definePref<'auto' | 'false' | 'true'>({
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
          useCustomDelimiters: definePref<string>({
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
          shownTables: definePref<RA<number> | 'legacy'>({
            title: localized('_shownTables'),
            requiresReload: false,
            visible: false,
            defaultValue: 'legacy',
            renderer: f.never,
            container: 'div',
          }),
        },
      },
      schema: {
        title: schemaText.schemaConfig(),
        items: {
          language: definePref<string>({
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
          textAreaAutoGrow: definePref<boolean>({
            title: preferencesText.textAreaAutoGrow(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          updatePageTitle: definePref<boolean>({
            title: preferencesText.updatePageTitle(),
            description: preferencesText.updatePageTitleFormDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          tableNameInTitle: definePref<boolean>({
            title: preferencesText.tableNameInTitle(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          focusFirstField: definePref<boolean>({
            title: preferencesText.focusFirstField(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          formHeaderFormat: definePref<'full' | 'icon' | 'name'>({
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
          makeFormDialogsModal: definePref<boolean>({
            title: preferencesText.makeFormDialogsModal(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          openAsReadOnly: definePref<boolean>({
            title: preferencesText.openAsReadOnly(),
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
          flexibleColumnWidth: definePref<boolean>({
            title: preferencesText.flexibleColumnWidth(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          flexibleSubGridColumnWidth: definePref<boolean>({
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
          fontSize: definePref<number>({
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
          fontFamily: definePref<string>({
            title: preferencesText.fontFamily(),
            description: preferencesText.fontFamilyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: defaultFont,
            renderer: FontFamilyPreferenceItem,
            container: 'label',
          }),
          maxWidth: definePref<number>({
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
          limitMaxFieldWidth: definePref<boolean>({
            title: preferencesText.limitMaxFieldWidth(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          specifyNetworkBadge: definePref<boolean>({
            title: preferencesText.specifyNetworkBadge(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          useAccessibleFullDatePicker: definePref<boolean>({
            title: preferencesText.useAccessibleFullDatePicker(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          useAccessibleMonthPicker: definePref<boolean>({
            title: preferencesText.useAccessibleMonthPicker(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          rightAlignNumberFields: definePref<boolean>({
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
          default: definePref({
            title: preferencesText.fieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#e5e7eb',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          disabled: definePref({
            title: preferencesText.disabledFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          invalid: definePref({
            title: preferencesText.invalidFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f87171',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          required: definePref({
            title: preferencesText.requiredFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#bfdbfe',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkDefault: definePref({
            title: preferencesText.darkFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#404040',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkDisabled: definePref({
            title: preferencesText.darkDisabledFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkInvalid: definePref({
            title: preferencesText.darkInvalidFieldBackground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#991b1b',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkRequired: definePref({
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
          foreground: definePref({
            title: preferencesText.foreground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#ffffff',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          background: definePref({
            title: preferencesText.background(),
            requiresReload: false,
            visible: true,
            defaultValue: '#e5e7eb',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkForeground: definePref({
            title: preferencesText.darkForeground(),
            requiresReload: false,
            visible: true,
            defaultValue: '#171717',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          darkBackground: definePref({
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
          searchAlgorithm: definePref<
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
          highlightMatch: definePref<boolean>({
            title: preferencesText.highlightMatch(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          autoGrowAutoComplete: definePref<boolean>({
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
          searchAlgorithm: definePref<'contains' | 'startsWith'>({
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
                description: localized(
                  `${preferencesText.containsDescription()} ${preferencesText.containsSecondDescription()}`
                ),
              },
            ],
          }),
          treeSearchAlgorithm: definePref<'contains' | 'startsWith'>({
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
                description: localized(
                  `${preferencesText.containsDescription()} ${preferencesText.containsSecondDescription()}`
                ),
              },
            ],
          }),
          alwaysUseQueryBuilder: definePref<boolean>({
            title: preferencesText.alwaysUseQueryBuilder(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      recordSet: {
        title: '_recordSet' as LocalizedString,
        items: {
          recordToOpen: definePref<'first' | 'last'>({
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
          maxHeight: definePref<number>({
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
        title: localized('_(not visible to user) Preferences'),
        items: {
          /*
           * This has to be an object rather than an array to allow forms to
           * override this value when this value is undefined for a given table
           */
          printOnSave: definePref<Partial<RR<keyof Tables, boolean>>>({
            title: localized('_Generate label on form save'),
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: f.never,
            container: 'div',
          }),
          carryForward: definePref<{
            readonly [TABLE_NAME in keyof Tables]?: RA<
              TableFields<Tables[TABLE_NAME]>
            >;
          }>({
            title: localized('_carryForward'),
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: f.never,
            container: 'div',
          }),
          bulkCarryForward: definePref<{
            readonly [TABLE_NAME in keyof Tables]?: RA<
              TableFields<Tables[TABLE_NAME]>
            >;
          }>({
            title: localized('_bulkCarryForward'),
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: f.never,
            container: 'div',
          }),
          enableCarryForward: definePref<RA<keyof Tables>>({
            title: localized('_enableCarryForward'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
          enableBukCarryForward: definePref<RA<keyof Tables>>({
            title: localized('_enableBulkCarryForward'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
          /*
           * Can temporary disable clone for a given table
           * Since most tables are likely to have carry enabled, this pref is
           * negated (so as not waste too much space)
           */
          disableClone: definePref<RA<keyof Tables>>({
            title: localized('disableClone'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
          disableAdd: definePref<RA<keyof Tables>>({
            title: localized('_disableAdd'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
          autoNumbering: definePref<{
            readonly [TABLE_NAME in keyof Tables]?: RA<
              TableFields<Tables[TABLE_NAME]>
            >;
          }>({
            title: localized('_autoNumbering'),
            requiresReload: false,
            visible: false,
            defaultValue: {},
            renderer: f.never,
            container: 'div',
          }),
          /*
           * Confusingly, this array contains a list of tables for which custom
           * form is not used - autogenerated form will be used. Naming it
           * useAutoGenerateForm would have been a better choice.
           * REFACTOR: consider renaming this once preferences migrations are
           *    implemented
           */
          useCustomForm: definePref<RA<keyof Tables>>({
            title: localized('_useCustomForm'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
          carryForwardShowHidden: definePref<boolean>({
            title: localized('_carryForwardShowHidden'),
            requiresReload: false,
            visible: false,
            defaultValue: false,
            type: 'java.lang.Boolean',
            container: 'div',
          }),
          bulkCarryForwardShowHidden: definePref<boolean>({
            title: localized('_bulkCarryForwardShowHidden'),
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
          alwaysPrompt: definePref<boolean>({
            title: preferencesText.alwaysPrompt(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          sortOrder: definePref<
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
          autoPlay: definePref<boolean>({
            title: preferencesText.autoPlayMedia(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          displayOriginal: definePref<'full' | 'thumbnail'>({
            title: preferencesText.attachmentPreviewMode(),
            requiresReload: false,
            visible: true,
            defaultValue: 'full',
            values: [
              {
                value: 'full',
                title: preferencesText.fullResolution(),
              },
              {
                value: 'thumbnail',
                title: preferencesText.thumbnail(),
              },
            ],
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
          autoScroll: definePref<boolean>({
            title: preferencesText.autoScrollTree(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          searchCaseSensitive: definePref<boolean>({
            title: preferencesText.searchCaseSensitive(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          searchField: definePref<'fullName' | 'name'>({
            title: preferencesText.searchField(),
            requiresReload: false,
            visible: true,
            defaultValue: 'name',
            values: [
              {
                value: 'name',
                // Replaced with localized version once schema is loaded
                title: localized('_name'),
              },
              {
                value: 'fullName',
                // Replaced with localized version once schema is loaded
                title: localized('_fullName'),
              },
            ],
          }),
          searchAlgorithm: definePref<'contains' | 'startsWith'>({
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
          treeAccentColor: definePref({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: definePref({
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
          treeAccentColor: definePref({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: definePref({
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
          treeAccentColor: definePref({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: definePref({
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
          treeAccentColor: definePref({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: definePref({
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
          treeAccentColor: definePref({
            title: preferencesText.treeAccentColor(),
            requiresReload: false,
            visible: true,
            defaultValue: '#f79245',
            renderer: ColorPickerPreferenceItem,
            container: 'label',
          }),
          synonymColor: definePref({
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
          noRestrictionsMode: definePref<boolean>({
            title: preferencesText.noRestrictionsMode(),
            description: (
              <span>
                {preferencesText.noRestrictionsModeQueryDescription()}
              </span>
            ),
            requiresReload: false,
            visible: 'protected',
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showNoReadTables: definePref<boolean>({
            title: preferencesText.showNoReadTables(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          shownTables: definePref<RA<number>>({
            title: localized('_shownTables'),
            requiresReload: false,
            visible: false,
            defaultValue: [],
            renderer: f.never,
            container: 'div',
          }),
        },
      },
      behavior: {
        title: preferencesText.behavior(),
        items: {
          stickyScrolling: definePref<boolean>({
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
          exportFileDelimiter: definePref<' ' | ',' | ';' | '\t' | '|'>({
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
          exportCsvUtf8Bom: definePref<boolean>({
            title: preferencesText.exportCsvUtf8Bom(),
            description: (
              <span>{preferencesText.exportCsvUtf8BomDescription()}</span>
            ),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          displayBasicView: definePref<boolean>({
            title: preferencesText.displayBasicView(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showComparisonOperatorsForString: definePref<boolean>({
            title: preferencesText.showComparisonOperatorsForString(),
            description: preferencesText.showComparisonOperatorsDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      appearance: {
        title: preferencesText.appearance(),
        items: {
          condenseQueryResults: definePref<boolean>({
            title: preferencesText.condenseQueryResults(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          showLineNumber: definePref<boolean>({
            title: preferencesText.showLineNumber(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  recordMerging: {
    title: mergingText.recordMerging(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          autoPopulate: definePref<boolean>({
            title: mergingText.autoPopulate(),
            description: preferencesText.autoPopulateDescription(),
            requiresReload: false,
            visible: 'protected',
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      agent: {
        title: 'Agent' as LocalizedString,
        items: {
          createVariants: definePref<boolean>({
            title: () =>
              preferencesText.autoCreateVariants({
                agentVariantTable: tableLabel('AgentVariant'),
              }),
            description: () =>
              preferencesText.autoCreateVariantsDescription({
                agentVariantTable: tableLabel('AgentVariant'),
              }),
            requiresReload: false,
            visible: 'protected',
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
          clearQueryFilters: definePref<boolean>({
            title: preferencesText.clearQueryFilters(),
            description: preferencesText.clearQueryFiltersDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          queryParamtersFromForm: definePref<boolean>({
            title: preferencesText.queryParamtersFromForm(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  workBench: {
    title: wbText.workBench(),
    subCategories: {
      general: {
        title: preferencesText.general(),
        items: {
          liveValidation: definePref<boolean>({
            title: wbText.dataCheck(),
            description: wbText.dataCheckDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      editor: {
        title: preferencesText.spreadsheet(),
        items: {
          minSpareRows: definePref<number>({
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
          autoWrapCol: definePref<boolean>({
            title: preferencesText.autoWrapCols(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          autoWrapRow: definePref<boolean>({
            title: preferencesText.autoWrapRows(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          tabMoveDirection: definePref<'col' | 'row'>({
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
          enterMoveDirection: definePref<'col' | 'row'>({
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
          enterBeginsEditing: definePref<boolean>({
            title: preferencesText.enterBeginsEditing(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          filterPickLists: definePref<
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
          exportFileDelimiter: definePref<' ' | ',' | ';' | '\t' | '|'>({
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
      wbPlanView: {
        title: wbPlanText.dataMapper(),
        items: {
          showNewDataSetWarning: definePref<boolean>({
            title: preferencesText.showNewDataSetWarning(),
            description: preferencesText.showNewDataSetWarningDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          noRestrictionsMode: definePref<boolean>({
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
          showNoAccessTables: definePref<boolean>({
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
      appearance: {
        title: preferencesText.appearance(),
        items: {
          localizeResourceNames: definePref<boolean>({
            title: preferencesText.localizeResourceNames(),
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
          lineWrap: definePref<boolean>({
            title: preferencesText.lineWrap(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          indentSize: definePref<number>({
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
          indentWithTab: definePref<boolean>({
            title: preferencesText.indentWithTab(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          splitLongXml: definePref<boolean>({
            title: preferencesText.splitLongXml(),
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
          layout: definePref<RA<StatLayout> | undefined>({
            title: localized('_Defines the layout of the stats page'),
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
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
          doubleClickZoom: definePref<boolean>({
            title: preferencesText.doubleClickZoom(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          closePopupOnClick: definePref<boolean>({
            title: preferencesText.closePopupOnClick(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          animateTransitions: definePref<boolean>({
            title: preferencesText.animateTransitions(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          panInertia: definePref<boolean>({
            title: preferencesText.panInertia(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          mouseDrags: definePref<boolean>({
            title: preferencesText.mouseDrags(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          scrollWheelZoom: definePref<boolean>({
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
import('../DataModel/tables')
  .then(async ({ fetchContext, tables }) =>
    fetchContext.then(() => {
      const trees = userPreferenceDefinitions.treeEditor.subCategories;
      overwriteReadOnly(
        trees.geography,
        'title',
        getField(tables.Geography, 'name').label
      );
      overwriteReadOnly(
        trees.taxon,
        'title',
        getField(tables.Taxon, 'name').label
      );
      overwriteReadOnly(
        trees.storage,
        'title',
        getField(tables.Storage, 'name').label
      );
      overwriteReadOnly(
        trees.geologicTimePeriod,
        'title',
        getField(tables.Geography, 'name').label
      );
      overwriteReadOnly(
        trees.lithoStrat,
        'title',
        getField(tables.LithoStrat, 'name').label
      );
      overwriteReadOnly(
        userPreferenceDefinitions.form.subCategories.recordSet,
        'title',
        getField(tables.RecordSet, 'name').label
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
        overwriteReadOnly(name, 'title', getField(tables.Taxon, 'name').label);
        overwriteReadOnly(
          fullName,
          'title',
          getField(tables.Taxon, 'fullName').label
        );
      } else softError('Unable to replace the tree preferences item title');
    })
  )
  // Not using softFail here to avoid circular dependency
  .catch(console.error);

ensure<GenericPreferences>()(userPreferenceDefinitions);
