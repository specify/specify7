import 'rc-slider/assets/index.css';

import Slider from 'rc-slider';
import React from 'react';

import { specifyNetworkText } from '../../localization/specifyNetwork';
import type { GetSet } from '../../utils/types';
import { writable } from '../../utils/types';
import { Input } from '../Atoms/Form';

export function Range({
  range,
  value: [value, setValue],
  isReadOnly = false,
}: {
  readonly range: readonly [min: number, max: number];
  readonly value: GetSet<readonly [min: number, max: number]>;
  readonly isReadOnly?: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input.Integer
        aria-label={specifyNetworkText.startYear()}
        className="w-20"
        isReadOnly={isReadOnly}
        max={Math.min(range[1], value[1])}
        min={range[0]}
        value={value[0]}
        onValueChange={(newMin): void => setValue([newMin, value[1]])}
      />
      <div className="w-full md:w-60">
        <Slider
          disabled={isReadOnly}
          max={range[1]}
          min={range[0]}
          range
          value={writable(value)}
          onChange={(value): void =>
            isProperValue(value) ? setValue(value) : undefined
          }
        />
      </div>
      <Input.Integer
        aria-label={specifyNetworkText.endYear()}
        className="w-20"
        isReadOnly={isReadOnly}
        max={range[1]}
        min={Math.max(range[0], value[0])}
        value={value[1]}
        onValueChange={(newMax): void => setValue([value[0], newMax])}
      />
    </div>
  );
}

const isProperValue = (
  value: number | readonly number[]
): value is readonly [number, number] =>
  Array.isArray(value) && value.length === 2;
