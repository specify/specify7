import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { fieldFormatterLocalization } from '.';
import type { FieldFormatter, FieldFormatterPart } from './spec';
import {
  fieldFormatterTypesWithForcedSize,
  normalizeFieldFormatterPart,
} from './spec';

export function FieldFormatterParts({
  fieldFormatter: [fieldFormatter, setFieldFormatter],
}: {
  readonly fieldFormatter: GetSet<FieldFormatter>;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  const { parts } = fieldFormatter;

  const setParts = (newParts: typeof parts): void =>
    setFieldFormatter({
      ...fieldFormatter,
      parts: newParts,
    });

  return (
    <>
      {parts.length === 0 ? undefined : (
        <table
          className={`
            grid-table
            grid-cols-[auto_4rem_auto_auto_min-content]
            gap-2 [&_td]:!items-stretch
          `}
        >
          <thead>
            <tr>
              <th>{resourcesText.type()}</th>
              <th>{commonText.size()}</th>
              <th>{resourcesText.hint()}</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => (
              <Part
                key={index}
                part={[
                  part,
                  (part): void => setParts(replaceItem(parts, index, part)),
                ]}
                onRemove={(): void => setParts(removeItem(parts, index))}
              />
            ))}
          </tbody>
        </table>
      )}
      {isReadOnly ? undefined : (
        <div className="flex gap-2 pt-2">
          <Button.Secondary
            onClick={(): void =>
              setParts([
                ...parts,
                {
                  type: 'constant',
                  size: 1,
                  placeholder: localized(''),
                  regexPlaceholder: undefined,
                  byYear: false,
                  autoIncrement: false,
                },
              ])
            }
          >
            {resourcesText.addField()}
          </Button.Secondary>
        </div>
      )}
    </>
  );
}

function Part({
  part: [part, handleChange],
  onRemove: handleRemove,
}: {
  readonly part: GetSet<FieldFormatterPart>;
  readonly onRemove: () => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  const enforcePlaceholderSize = fieldFormatterTypesWithForcedSize.has(
    part.type as 'constant'
  );

  return (
    <tr>
      <td>
        <Select
          aria-label={resourcesText.type()}
          disabled={isReadOnly}
          value={part.type ?? 'constant'}
          onValueChange={(newType): void =>
            handleChange(
              normalizeFieldFormatterPart({
                ...part,
                type: newType as keyof typeof fieldFormatterLocalization,
              })
            )
          }
        >
          {Object.entries(fieldFormatterLocalization).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </Select>
      </td>
      <td>
        <Input.Integer
          aria-label={commonText.size()}
          disabled={enforcePlaceholderSize}
          isReadOnly={isReadOnly}
          min={1}
          required
          value={part.size}
          onValueChange={(size): void =>
            handleChange(
              normalizeFieldFormatterPart({
                ...part,
                size,
              })
            )
          }
        />
      </td>
      <td>
        <Input.Text
          aria-label={resourcesText.hint()}
          disabled={part.type === 'year' || part.type === 'numeric'}
          isReadOnly={isReadOnly}
          required
          value={
            part.type === 'regex'
              ? part.regexPlaceholder ?? ''
              : part.placeholder
          }
          onValueChange={(placeholder): void =>
            handleChange(
              normalizeFieldFormatterPart({
                ...part,
                [part.type === 'regex' ? 'regexPlaceholder' : 'placeholder']:
                  placeholder,
              })
            )
          }
        />
      </td>
      <td>
        {part.type === 'numeric' ? (
          <Label.Inline>
            <Input.Checkbox
              checked={part.autoIncrement}
              isReadOnly={isReadOnly}
              onValueChange={(autoIncrement): void =>
                handleChange({
                  ...part,
                  autoIncrement,
                })
              }
            />
            {formsText.autoNumber()}
          </Label.Inline>
        ) : part.type === 'year' ? (
          <Label.Inline>
            <Input.Checkbox
              checked={part.byYear}
              isReadOnly={isReadOnly}
              onValueChange={(byYear): void =>
                handleChange({
                  ...part,
                  byYear,
                })
              }
            />
            {formsText.autoNumberByYear()}
          </Label.Inline>
        ) : part.type === 'regex' ? (
          <RegexField
            value={part.placeholder}
            onChange={(placeholder): void =>
              handleChange({
                ...part,
                placeholder,
              })
            }
          />
        ) : undefined}
      </td>
      <td>
        {isReadOnly ? undefined : (
          <Button.Small
            aria-label={commonText.remove()}
            title={commonText.remove()}
            variant={className.dangerButton}
            onClick={handleRemove}
          >
            {icons.trash}
          </Button.Small>
        )}
      </td>
    </tr>
  );
}

function RegexField({
  value,
  onChange: handleChange,
}: {
  readonly value: LocalizedString;
  readonly onChange: (newValue: LocalizedString) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [pendingValue, setPendingValue] = useTriggerState(value);
  return (
    <Input.Text
      aria-label={resourcesText.pattern()}
      isReadOnly={isReadOnly}
      placeholder={resourcesText.pattern()}
      required
      value={pendingValue}
      onBlur={({ target }): void => {
        try {
          // Regex may be coming from the user, thus disable strict mode
          // eslint-disable-next-line require-unicode-regexp
          void new RegExp(target.value);
          handleChange(target.value as LocalizedString);
        } catch (error: unknown) {
          target.setCustomValidity(String(error));
          target.reportValidity();
        }
      }}
      onValueChange={setPendingValue}
    />
  );
}
