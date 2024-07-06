import React from 'react';

import { useValidation } from '../../hooks/useValidation';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { resourcesText } from '../../localization/resources';
import type { GetSet } from '../../utils/types';
import { localized } from '../../utils/types';
import { removeItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { fieldFormatterLocalization, fieldFormatterTypeMapper } from '.';
import type { FieldFormatter, FieldFormatterPart } from './spec';

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
          /*
           * REFACTOR: replace min-w-[35rem] with a container query that replaces
           *   table layout with list layout
           */
          className={`
            grid-table min-w-[35rem]
            grid-cols-[auto_4rem_auto_auto_min-content]
            gap-2 [&_td]:!items-stretch
          `}
        >
          <thead>
            <tr>
              <th>{resourcesText.type()}</th>
              <th>{commonText.size()}</th>
              <th>{resourcesText.hint()}</th>
              <th>{formsText.autoNumber()}</th>
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
      {isReadOnly ? null : (
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

  React.useEffect(() => {
    if (part.type === 'year')
      handleChange({
        ...part,
        size: 4,
        placeholder: fieldFormatterTypeMapper.year.placeholder,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part.type]);

  React.useEffect(() => {
    if (part.type === 'numeric')
      handleChange({
        ...part,
        placeholder: fieldFormatterTypeMapper.numeric.buildPlaceholder(
          part.size
        ),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part.size, part.type]);

  const enforcePlaceholderSize =
    part.type === 'constant' ||
    part.type === 'separator' ||
    part.type === 'year';

  const placeholderSize = enforcePlaceholderSize ? part.size : undefined;

  /**
   * While native browser validation does length enforcement, it only does so
   * when the field value is changed by the user - if field already had
   * incorrect value, or if validation requirement changed (because size field
   * was changed), browser won't automatically re-validate so we have to
   */
  const requestedSize = placeholderSize ?? part.placeholder.length;
  const actualSize = part.placeholder.length;
  const { validationRef } = useValidation(
    actualSize > requestedSize
      ? queryText.tooLongErrorMessage({ maxLength: requestedSize })
      : actualSize < requestedSize
      ? queryText.tooShortErrorMessage({ minLength: requestedSize })
      : undefined
  );

  return (
    <tr>
      <td>
        <Select
          aria-label={resourcesText.type()}
          disabled={isReadOnly}
          value={part.type}
          onValueChange={(newType): void =>
            handleChange({
              ...part,
              type: newType as keyof typeof fieldFormatterLocalization,
            })
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
          min={0}
          required
          value={part.size}
          onValueChange={(size): void =>
            handleChange({
              ...part,
              size,
            })
          }
          isReadOnly={isReadOnly}
          // Size is hardcoded to 4 for year
          disabled={part.type === 'year'}
        />
      </td>
      <td>
        <Input.Text
          aria-label={resourcesText.hint()}
          disabled={part.type === 'year'}
          forwardRef={validationRef}
          isReadOnly={isReadOnly}
          maxLength={placeholderSize}
          minLength={placeholderSize}
          required
          value={part.placeholder}
          onValueChange={(placeholder): void =>
            handleChange({
              ...part,
              placeholder,
            })
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
        ) : undefined}
      </td>
      <td>
        {isReadOnly ? null : (
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
