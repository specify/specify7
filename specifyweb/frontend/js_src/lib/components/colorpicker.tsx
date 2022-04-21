import React from 'react';

import type { PreferenceItemComponent } from '../preferences';
import { Input } from './basic';
import { iconClassName } from './icons';

export const defaultFont = 'default';
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
