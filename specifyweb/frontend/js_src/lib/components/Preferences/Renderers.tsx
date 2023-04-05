/**
 * Renderers for a preference item.
 * Most use the default renderes, but there are some exceptions
 */

import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { welcomeText } from '../../localization/welcome';
import { getAvailableFonts } from '../../utils/fonts';
import { f } from '../../utils/functools';
import {
  getValidationAttributes,
  mergeParsers,
  parserFromType,
} from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import type { RA } from '../../utils/types';
import { Input, Select, Textarea } from '../Atoms/Form';
import { iconClassName } from '../Atoms/Icons';
import type { AnySchema } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Collection } from '../DataModel/types';
import { AutoComplete } from '../Molecules/AutoComplete';
import { userPreferences } from './userPreferences';
import { ListEdit } from '../Toolbar/QueryTablesEdit';
import { headerText } from '../../localization/header';
import { useMenuItems, useUserTools } from '../Header/menuItemProcessing';
import { rawMenuItemsPromise } from '../Header/menuItemDefinitions';
import { PreferenceItem, PreferenceItemComponent } from './UserDefinitions';
import { usePromise } from '../../hooks/useAsyncState';

export const ColorPickerPreferenceItem: PreferenceItemComponent<string> =
  function ColorPickerPreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    return (
      <div className={`relative ${iconClassName}`}>
        <span
          className="block h-full w-full rounded-full"
          style={{
            backgroundColor: value,
          }}
        />
        <Input.Generic
          className="sr-only !top-[unset] bottom-0 h-auto opacity-0"
          isReadOnly={isReadOnly}
          maxLength={7}
          minLength={7}
          pattern="^#[0-9a-fA-F]{6}$"
          required
          type="color"
          value={value}
          onValueChange={handleChange}
        />
      </div>
    );
  };

export const CollectionSortOrderPreferenceItem: PreferenceItemComponent<
  keyof Collection['fields'] | `-${keyof Collection['fields']}`
> = function CollectionSortOrderPreferenceItem({
  value,
  onChange: handleChange,
  isReadOnly,
}) {
  return (
    <OrderPicker
      isReadOnly={isReadOnly}
      model={schema.models.Collection}
      order={value}
      onChange={handleChange}
    />
  );
};

export function OrderPicker<SCHEMA extends AnySchema>({
  model,
  order,
  onChange: handleChange,
  isReadOnly = false,
}: {
  readonly model: SpecifyModel<SCHEMA>;
  readonly order:
    | `-${string & keyof SCHEMA['fields']}`
    | (string & keyof SCHEMA['fields'])
    | undefined;
  readonly onChange: (
    order:
      | `-${string & keyof SCHEMA['fields']}`
      | (string & keyof SCHEMA['fields'])
  ) => void;
  readonly isReadOnly?: boolean;
}): JSX.Element {
  return (
    <Select
      disabled={isReadOnly}
      value={order}
      onValueChange={(newOrder): void =>
        handleChange(newOrder as Exclude<typeof order, undefined>)
      }
    >
      <option value="">{commonText.none()}</option>
      <optgroup label={commonText.ascending()}>
        {model.literalFields
          .filter(
            /*
             * "order === name" is necessary in case Accession.timestampCreated
             * is a hidden field in the schema
             */
            ({ isHidden, name }) => !isHidden || order === name
          )
          .map(({ name, label }) => (
            <option key={name} value={name}>
              {label}
            </option>
          ))}
      </optgroup>
      <optgroup label={commonText.descending()}>
        {model.literalFields
          .filter(({ isHidden, name }) => !isHidden || order?.slice(1) === name)
          .map(({ name, label }) => (
            <option key={name} value={`-${name}`}>
              {label}
            </option>
          ))}
      </optgroup>
    </Select>
  );
}

export const defaultFont = 'default';
export const FontFamilyPreferenceItem: PreferenceItemComponent<string> =
  function FontFamilyPreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const items = React.useMemo(
      () => [
        {
          label: (
            <span className="font-sans">{preferencesText.defaultFont()}</span>
          ),
          searchValue: preferencesText.defaultFont(),
          data: defaultFont,
        },
        ...getAvailableFonts().map((item) => ({
          label: <span style={{ fontFamily: item }}>{item}</span>,
          searchValue: item,
          data: item,
        })),
      ],
      []
    );
    return isReadOnly ? (
      <Input.Text isReadOnly value={value} />
    ) : (
      <AutoComplete<string>
        aria-label={undefined}
        delay={0}
        filterItems
        minLength={0}
        source={items}
        // OnCleared={}
        value={value === defaultFont ? preferencesText.defaultFont() : value}
        onChange={({ data }): void => handleChange(data)}
        onNewValue={handleChange}
      />
    );
  };

export type WelcomePageMode =
  | 'customImage'
  | 'default'
  | 'embeddedWebpage'
  | 'taxonTiles';
export const defaultWelcomePageImage = '/static/img/splash_screen.svg';
const welcomePageModes: PreferenceItem<WelcomePageMode> = {
  title: preferencesText.content(),
  requiresReload: false,
  visible: true,
  defaultValue: 'default',
  values: [
    {
      value: 'default',
      title: preferencesText.defaultImage(),
    },
    {
      value: 'taxonTiles',
      title: welcomeText.taxonTiles(),
    },
    {
      value: 'customImage',
      title: preferencesText.customImage(),
      description: preferencesText.customImageDescription(),
    },
    // FEATURE: make documentation more user friendly and reEnable this:
    /*
     *{
     *  value: 'embeddedWebpage',
     *  title: preferencesText.embeddedWebpage(),
     *  description: preferencesText.embeddedWebpageDescription(),
     *},
     */
  ],
};

export const WelcomePageModePreferenceItem: PreferenceItemComponent<WelcomePageMode> =
  function WelcomePageModePreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const [source, setSource] = userPreferences.use(
      'welcomePage',
      'general',
      'source'
    );
    const sourceDefinition = userPreferences.definition(
      'welcomePage',
      'general',
      'source'
    );

    return (
      <>
        <DefaultPreferenceItemRender
          category="welcomePage"
          definition={welcomePageModes}
          isReadOnly={isReadOnly}
          item="mode"
          subcategory="general"
          value={value}
          onChange={handleChange}
        />
        {value === 'customImage' || value === 'embeddedWebpage' ? (
          <DefaultPreferenceItemRender
            category="welcomePage"
            definition={sourceDefinition}
            isReadOnly={isReadOnly}
            item="source"
            subcategory="general"
            value={source}
            onChange={setSource}
          />
        ) : undefined}
      </>
    );
  };

export type MenuPreferences = {
  readonly visible: RA<string>;
  /**
   * Need to explicitly keep track of hidden items so that when future Specify
   * versions add new items to menu, they are visible by default
   */
  readonly hidden: RA<string>;
};

export const HeaderItemsPreferenceItem: PreferenceItemComponent<MenuPreferences> =
  function HeaderItemsPreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const [rawMenuItems] = usePromise(rawMenuItemsPromise, false);
    const menuItems = useMenuItems();
    const rawUserTools = useUserTools();
    const userTools = React.useMemo(
      () =>
        rawUserTools === undefined || menuItems === undefined
          ? undefined
          : Object.values(rawUserTools)
              .flatMap((entries) => Object.values(entries))
              .flat()
              .filter(
                ({ name }) => !menuItems.some((item) => item.name === name)
              ),
      [rawUserTools, menuItems]
    );

    const defaultItems = rawMenuItems?.map(({ name }) => name) ?? [];
    return menuItems === undefined || userTools === undefined ? (
      <>{commonText.loading()}</>
    ) : (
      <ListEdit
        allItems={[...menuItems, ...userTools].map(({ name, title }) => ({
          name,
          label: title,
        }))}
        defaultValues={defaultItems}
        isReadOnly={isReadOnly}
        selectedValues={
          value.visible.length === 0 ? defaultItems : value.visible
        }
        onChange={(selectedItems): void =>
          handleChange({
            visible: selectedItems,
            hidden: defaultItems.filter(
              (item) => !selectedItems.includes(item)
            ),
          })
        }
        selectedLabel={headerText.menuItems()}
        availableLabel={headerText.userTools()}
      />
    );
  };

// BUG: either make inputs required, or handle no value case
export const DefaultPreferenceItemRender: PreferenceItemComponent<any> =
  function ({ definition, value, onChange: handleChange, isReadOnly }) {
    const parser =
      'type' in definition
        ? typeof definition.parser === 'object'
          ? mergeParsers(parserFromType(definition.type), definition.parser)
          : parserFromType(definition.type)
        : undefined;
    const validationAttributes = React.useMemo(
      () => f.maybe(parser, getValidationAttributes),
      [parser]
    );
    const { validationRef, inputRef, setValidation } = useValidation();
    const [internalValue, setInternalValue] = useTriggerState(value);
    const handleChanged =
      definition.setOnBlurOnly === true ? setInternalValue : handleChange;
    const handleBlur =
      definition.setOnBlurOnly === true
        ? (): void => handleChange(internalValue)
        : undefined;
    return 'values' in definition ? (
      <>
        <Select
          disabled={isReadOnly}
          value={internalValue}
          onBlur={handleBlur}
          onValueChange={handleChanged}
        >
          {definition.values.map(({ value, title }) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
        {f.maybe(
          definition.values.find((item) => item.value === value).description,
          (description) => (
            <p>{description}</p>
          )
        )}
      </>
    ) : parser?.type === 'checkbox' ? (
      <Input.Checkbox
        checked={value}
        isReadOnly={isReadOnly}
        onValueChange={handleChange}
      />
    ) : parser?.type === 'text' ? (
      <Textarea
        forwardRef={validationRef}
        {...(validationAttributes ?? { type: 'text' })}
        isReadOnly={isReadOnly}
        value={internalValue}
        onBlur={handleBlur}
        onValueChange={(newValue): void => {
          if (typeof parser === 'object' && inputRef.current !== null) {
            const parsed = parseValue(
              parser,
              inputRef.current,
              newValue,
              false
            );
            if (parsed.isValid) handleChanged(newValue);
            else setValidation(parsed.reason);
          } else handleChanged(newValue);
        }}
      />
    ) : (
      <Input.Generic
        forwardRef={validationRef}
        {...(validationAttributes ?? { type: 'text' })}
        isReadOnly={isReadOnly}
        value={internalValue}
        onBlur={handleBlur}
        onValueChange={(newValue): void => {
          if (typeof parser === 'object' && inputRef.current !== null) {
            const parsed = parseValue(parser, inputRef.current, newValue);
            if (!parsed.isValid) setValidation(parsed.reason);
            /**
             * Set value, even if invalid.
             * Fixes https://github.com/specify/specify7/issues/1566
             */
            if (parsed.isValid || definition.setOnBlurOnly === true)
              handleChanged(newValue);
          } else handleChanged(newValue);
        }}
      />
    );
  };
