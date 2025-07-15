import React from 'react';

import { userText } from '../../localization/user';
import { AutoComplete } from '../Molecules/AutoComplete';

export const currentUserValue = 'currentSpecifyUserName';
const items = [
  {
    label: userText.currentUser(),
    searchValue: userText.currentUser(),
    data: currentUserValue,
  },
] as const;

export function SpecifyUserAutoComplete({
  startValue,
  onChange: handleChange,
}: {
  readonly startValue: string;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element {
  const valueRef = React.useRef<string>(startValue);
  const label =
    items.find((item) => item.data === startValue)?.label ?? startValue;
  return (
    <div className="flex items-center">
      <AutoComplete<string>
        aria-label={undefined}
        delay={0}
        disabled={handleChange === undefined}
        filterItems
        inputProps={{
          onBlur: (): void =>
            handleChange?.(
              items.find(
                (item) =>
                  item.label === valueRef.current ||
                  item.searchValue === valueRef.current
              )?.data ?? valueRef.current
            ),
        }}
        minLength={0}
        pendingValueRef={valueRef}
        source={items}
        value={label}
        onChange={({ data }): void => handleChange?.(data)}
        onNewValue={handleChange}
      />
    </div>
  );
}
