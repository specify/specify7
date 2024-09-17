import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { iconClassName, icons } from '../Atoms/Icons';
import {
  mappingElementDivider,
  mappingElementDividerClassName,
} from '../WbPlanView/LineComponents';
import type { QueryFieldFilter } from './FieldFilter';
import type { QueryField } from './helpers';
export function FieldFilterTool({
  fieldFilters,
  index,
  isBasic,
  hasAny,
  isFieldComplete,
  handleChange,
  handleFilterChange,
}: {
  readonly fieldFilters: RA<{
    readonly type: QueryFieldFilter;
    readonly startValue: string;
    readonly isNot: boolean;
  }>;
  readonly index: number;
  readonly isBasic: boolean;
  readonly hasAny: boolean;
  readonly isFieldComplete: boolean;
  readonly handleChange: ((newField: QueryField) => void) | undefined;
  readonly handleFilterChange: (
    index: number,
    filter: QueryField['filters'][number] | undefined
  ) => void;
}): JSX.Element {
  return (
    <>
      {index === 0 ? (
        <>
          {isBasic ? null : mappingElementDivider}
          {!hasAny && (
            <Button.Small
              aria-label={queryText.or()}
              aria-pressed={fieldFilters.length > 1}
              className={`
                          print:hidden
                          ${className.ariaHandled}
                          ${isFieldComplete ? '' : 'invisible'}
                        `}
              disabled={handleChange === undefined}
              title={queryText.or()}
              variant={
                fieldFilters.length > 1
                  ? className.infoButton
                  : className.secondaryLightButton
              }
              onClick={(): void =>
                handleFilterChange(fieldFilters.length, {
                  type: 'any',
                  isNot: false,
                  startValue: '',
                })
              }
            >
              {icons.plus}
            </Button.Small>
          )}
        </>
      ) : (
        <>
          <span className={mappingElementDividerClassName}>
            <span
              className={`
                          flex items-center justify-center uppercase
                          ${iconClassName}
                        `}
            >
              {queryText.or()}
            </span>
          </span>
          <Button.Small
            aria-label={commonText.remove()}
            className="print:hidden"
            disabled={handleChange === undefined}
            title={commonText.remove()}
            variant={className.dangerButton}
            onClick={(): void => handleFilterChange(index, undefined)}
          >
            {icons.trash}
          </Button.Small>
        </>
      )}
      {fieldFilters[index].type !== 'any' && (
        <Button.Small
          aria-label={queryText.negate()}
          aria-pressed={fieldFilters[index].isNot}
          className={className.ariaHandled}
          disabled={handleChange === undefined}
          title={queryText.negate()}
          variant={
            fieldFilters[index].isNot
              ? className.dangerButton
              : className.secondaryLightButton
          }
          onClick={(): void =>
            handleFilterChange(index, {
              ...fieldFilters[index],
              isNot: !fieldFilters[index].isNot,
            })
          }
        >
          {icons.ban}
        </Button.Small>
      )}
    </>
  );
}