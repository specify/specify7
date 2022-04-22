import React from 'react';

import type { Collection } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { commonText } from '../localization/common';
import type { PreferenceItemComponent } from '../preferences';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { Input, Select } from './basic';
import { iconClassName } from './icons';
import { preferencesText } from '../localization/preferences';
import { getAvailableFonts } from '../fonts';
import { Autocomplete } from './autocomplete';

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
