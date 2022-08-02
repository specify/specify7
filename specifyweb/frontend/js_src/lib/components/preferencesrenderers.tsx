/**
 * Renderers for a preference item.
 * Most use the default renderes, but there are some exceptions
 */

import React from 'react';

import type { Collection } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { getAvailableFonts } from '../fonts';
import { f } from '../functools';
import { commonText } from '../localization/common';
import { preferencesText } from '../localization/preferences';
import { welcomeText } from '../localization/welcome';
import { getPrefDefinition } from '../preferencesutils';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import {
  getValidationAttributes,
  mergeParsers,
  parserFromType,
  parseValue,
} from '../uiparse';
import { Autocomplete } from './autocomplete';
import { Input, Select } from './basic';
import { useTriggerState, useValidation } from './hooks';
import { iconClassName } from './icons';
import type { PreferenceItem, PreferenceItemComponent } from './preferences';
import { usePref } from './preferenceshooks';

export const ColorPickerPreferenceItem: PreferenceItemComponent<string> =
  function ColorPickerPreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    return (
      <div className={`relative ${iconClassName}`}>
        <span
          className="block w-full h-full rounded-full"
          style={{
            backgroundColor: value,
          }}
        />
        <Input.Generic
          className={`sr-only`}
          type="color"
          value={value}
          onValueChange={handleChange}
          isReadOnly={isReadOnly}
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
      model={schema.models.Collection}
      order={value}
      onChange={handleChange}
      isReadOnly={isReadOnly}
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
    | (string & keyof SCHEMA['fields'])
    | `-${string & keyof SCHEMA['fields']}`;
  readonly onChange: (
    order:
      | (string & keyof SCHEMA['fields'])
      | `-${string & keyof SCHEMA['fields']}`
  ) => void;
  readonly isReadOnly?: boolean;
}): JSX.Element {
  return (
    <Select
      value={order}
      onValueChange={(newOrder): void => handleChange(newOrder as typeof order)}
      disabled={isReadOnly}
    >
      <option value="">{commonText('none')}</option>
      <optgroup label={commonText('ascending')}>
        {model.literalFields
          .filter(
            /*
             * "order === name" is necessary in case Accession.timestampCreated
             * is a hidden field in the schema
             */
            ({ overrides, name }) => !overrides.isHidden || order === name
          )
          .map(({ name, label }) => (
            <option value={name} key={name}>
              {label}
            </option>
          ))}
      </optgroup>
      <optgroup label={commonText('descending')}>
        {model.literalFields
          .filter(
            ({ overrides, name }) =>
              !overrides.isHidden || order.slice(1) === name
          )
          .map(({ name, label }) => (
            <option value={`-${name}`} key={name}>
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
            <span className="font-sans">{preferencesText('defaultFont')}</span>
          ),
          searchValue: preferencesText('defaultFont'),
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
      <Autocomplete<string>
        source={items}
        minLength={0}
        delay={0}
        onNewValue={handleChange}
        onChange={({ data }): void => handleChange(data)}
        filterItems={true}
        aria-label={undefined}
        value={value === defaultFont ? preferencesText('defaultFont') : value}
      >
        {(props): JSX.Element => <Input.Generic {...props} />}
      </Autocomplete>
    );
  };

export type WelcomePageMode =
  | 'default'
  | 'taxonTiles'
  | 'customImage'
  | 'embeddedWebpage';
export const defaultWelcomePageImage =
  '/static/img/icons_as_background_splash.png';
const welcomePageModes: PreferenceItem<WelcomePageMode> = {
  title: preferencesText('content'),
  requiresReload: false,
  visible: true,
  defaultValue: 'default',
  values: [
    {
      value: 'default',
      title: preferencesText('defaultImage'),
    },
    {
      value: 'taxonTiles',
      title: welcomeText('taxonTiles'),
    },
    {
      value: 'customImage',
      title: preferencesText('customImage'),
      description: preferencesText('customImageDescription'),
    },
    // FEATURE: make documentation more user friendly and reEnable this:
    /*{
      value: 'embeddedWebpage',
      title: preferencesText('embeddedWebpage'),
      description: preferencesText('embeddedWebpageDescription'),
    },*/
  ],
};

export const WelcomePageModePreferenceItem: PreferenceItemComponent<WelcomePageMode> =
  function WelcomePageModePreferenceItem({
    value,
    onChange: handleChange,
    isReadOnly,
  }) {
    const [source, setSource] = usePref('welcomePage', 'general', 'source');
    const sourceDefinition = getPrefDefinition(
      'welcomePage',
      'general',
      'source'
    );

    return (
      <>
        <DefaultPreferenceItemRender
          value={value}
          onChange={handleChange}
          definition={welcomePageModes}
          isReadOnly={isReadOnly}
        />
        {value === 'customImage' || value === 'embeddedWebpage' ? (
          <DefaultPreferenceItemRender
            definition={sourceDefinition}
            value={source}
            onChange={setSource}
            isReadOnly={isReadOnly}
          />
        ) : undefined}
      </>
    );
  };

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
          value={internalValue}
          onValueChange={handleChanged}
          onBlur={handleBlur}
          disabled={isReadOnly}
        >
          {definition.values.map(({ value, title }) => (
            <option key={value} value={value}>
              {title}
            </option>
          ))}
        </Select>
        {f.maybe(
          definition.values.find((item) => item.value === value).description,
          (item) => (
            <p>{item}</p>
          )
        )}
      </>
    ) : parser?.type === 'checkbox' ? (
      <Input.Checkbox
        checked={value}
        onValueChange={handleChange}
        isReadOnly={isReadOnly}
      />
    ) : (
      <Input.Generic
        forwardRef={validationRef}
        {...(validationAttributes ?? { type: 'text' })}
        value={internalValue}
        isReadOnly={isReadOnly}
        onValueChange={(newValue): void => {
          if (typeof parser === 'object' && inputRef.current !== null) {
            const parsed = parseValue(parser, inputRef.current, newValue);
            if (parsed.isValid) handleChanged(newValue);
            else setValidation(parsed.reason);
          } else handleChanged(newValue);
        }}
        onBlur={handleBlur}
      />
    );
  };
