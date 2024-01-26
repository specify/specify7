import type { LocalizedString } from 'typesafe-i18n';

import type { Parser } from '../../utils/parser/definitions';
import type { IR, RA } from '../../utils/types';
import type { JavaType } from '../DataModel/specifyField';

/** Custom Renderer for a preference item */
export type PreferenceRendererProps<VALUE> = {
  readonly category: string;
  readonly subcategory: string;
  readonly item: string;
  readonly definition: PreferenceItem<VALUE>;
  readonly value: VALUE;
  readonly onChange: (value: VALUE) => void;
};

export type PreferencesVisibilityContext = {
  readonly isDarkMode: boolean;
  readonly isRedirecting: boolean;
};

/**
 * Represents a single preference option
 *
 * The concept seems similar to the "Feature Gates" in Firefox:
 * https://firefox-source-docs.mozilla.org/toolkit/components/featuregates/featuregates/
 */
export type PreferenceItem<VALUE> = {
  readonly title: JSX.Element | LocalizedString | (() => LocalizedString);
  readonly description?:
    | JSX.Element
    | LocalizedString
    | (() => LocalizedString);
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
  readonly visible:
    | boolean
    | 'protected'
    | ((context: PreferencesVisibilityContext) => boolean);
  readonly defaultValue: VALUE;
} & (
  | {
      // Parses the stored value. Determines the input type to render
      readonly type: JavaType;
      readonly parser?: Parser;
    }
  | {
      readonly renderer: (props: PreferenceRendererProps<VALUE>) => JSX.Element;
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

/**
 * This is used to enforce the same generic value be used inside a PreferenceItem
 */
export const definePref = <VALUE>(
  definition: PreferenceItem<VALUE>
): PreferenceItem<VALUE> => definition;

export type GenericPreferences = IR<{
  readonly title: LocalizedString | (() => LocalizedString);
  readonly description?: LocalizedString | (() => LocalizedString);
  readonly subCategories: IR<{
    readonly title: LocalizedString | (() => LocalizedString);
    readonly description?: LocalizedString | (() => LocalizedString);
    readonly items: IR<PreferenceItem<any>>;
  }>;
}>;
