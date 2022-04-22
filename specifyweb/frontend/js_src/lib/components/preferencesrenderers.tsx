import React from 'react';

import type { Collection } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { getAvailableFonts } from '../fonts';
import { commonText } from '../localization/common';
import { preferencesText } from '../localization/preferences';
import { welcomeText } from '../localization/welcome';
import { getPrefDefinition } from '../preferencesutils';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { Autocomplete } from './autocomplete';
import { Input, Select } from './basic';
import { iconClassName } from './icons';
import type { PreferenceItem, PreferenceItemComponent } from './preferences';
import { usePref } from './preferenceshooks';
import { DefaultPreferenceItemRender } from './toolbar/preferences';

export const ColorPickerPreferenceItem: PreferenceItemComponent<string> =
  function ColorPickerPreferenceItem({ value, onChange: handleChange }) {
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
        />
      </div>
    );
  };

export const CollectionSortOrderPreferenceItem: PreferenceItemComponent<
  keyof Collection['fields'] | `-${keyof Collection['fields']}`
> = function CollectionSortOrderPreferenceItem({
  value,
  onChange: handleChange,
}) {
  return (
    <OrderPicker
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
}): JSX.Element {
  return (
    <Select
      value={order}
      onValueChange={(newOrder): void => handleChange(newOrder as typeof order)}
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
  function FontFamilyPreferenceItem({ value, onChange: handleChange }) {
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
    return (
      <Autocomplete<string>
        source={items}
        minLength={0}
        delay={0}
        onNewValue={handleChange}
        onChange={({ data }): void => handleChange(data)}
        // OnCleared={}
        filterItems={true}
        children={(props): JSX.Element => <Input.Generic {...props} />}
        aria-label={undefined}
        value={value === defaultFont ? preferencesText('defaultFont') : value}
      />
    );
  };

export type WelcomePageMode =
  | 'default'
  | 'taxonTiles'
  | 'customImage'
  | 'embeededWebpage';
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

    {
      value: 'embeededWebpage',
      title: preferencesText('embeededWebpage'),
      description: preferencesText('embeededWebpageDescription'),
    },
  ],
};

export const WelcomePageModePreferenceItem: PreferenceItemComponent<WelcomePageMode> =
  function WelcomePageModePreferenceItem({ value, onChange: handleChange }) {
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
        />
        {value === 'customImage' || value === 'embeededWebpage' ? (
          <DefaultPreferenceItemRender
            definition={sourceDefinition}
            value={source}
            onChange={setSource}
          />
        ) : undefined}
      </>
    );
  };
