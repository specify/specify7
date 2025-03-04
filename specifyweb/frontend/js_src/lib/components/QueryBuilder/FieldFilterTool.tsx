import React from 'react';

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { iconClassName, icons } from '../Atoms/Icons';
import {
  mappingElementDivider,
  mappingElementDividerClassName,
} from '../WbPlanView/LineComponents';
import { QueryFieldFilterType } from './FieldFilter';
import type { QueryFieldFilter } from './helpers';

type FieldFilterToolProps = {
  readonly fieldFilter: QueryFieldFilter;
  readonly isBasic: boolean;
  readonly isFirst: boolean;
  readonly hasMultipleFilters: boolean;
  readonly hasAny: boolean;
  readonly isFieldComplete: boolean;
  readonly onChange:
    | ((newFieldFilter: QueryFieldFilter | undefined) => void)
    | undefined;
  readonly onAddFieldFilter: (newFieldFilter: QueryFieldFilter) => void;
};

/**
 * Buttons relating to the management of the filter or change the behavior
 * of the filter
 *
 * Examples of these buttons are:
 *
 * Add Filter Button, Negate Filter Button, Remove Filter Button,
 * Toggle IsStrict Button (for CollectionObject -> Age queries)
 */
export function FieldFilterTool({
  fieldFilter,
  isFirst,
  isBasic,
  hasAny,
  hasMultipleFilters,
  isFieldComplete,
  onChange: handleChange,
  onAddFieldFilter: handleAddFieldFilter,
}: FieldFilterToolProps): JSX.Element {
  return (
    <>
      {/* REFACTOR: Extract this to separate component */}
      {isFirst ? (
        <>
          {isBasic ? null : mappingElementDivider}
          {!hasAny && (
            <Button.Small
              aria-label={queryText.or()}
              aria-pressed={hasMultipleFilters}
              className={`
                          print:hidden
                          ${className.ariaHandled}
                          ${isFieldComplete ? '' : 'invisible'}
                        `}
              title={queryText.or()}
              variant={
                hasMultipleFilters
                  ? className.infoButton
                  : className.secondaryLightButton
              }
              onClick={
                handleChange === undefined
                  ? undefined
                  : (): void =>
                      handleAddFieldFilter({
                        type: 'any',
                        isNot: false,
                        startValue: '',
                        isStrict: false,
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
            title={commonText.remove()}
            variant={className.dangerButton}
            onClick={
              handleChange === undefined
                ? undefined
                : (): void => handleChange?.(undefined)
            }
          >
            {icons.trash}
          </Button.Small>
        </>
      )}
      {fieldFilter.type !== 'any' && (
        <Button.Small
          aria-label={queryText.negate()}
          aria-pressed={fieldFilter.isNot}
          className={className.ariaHandled}
          title={queryText.negate()}
          variant={
            fieldFilter.isNot
              ? className.dangerButton
              : className.secondaryLightButton
          }
          onClick={
            handleChange === undefined
              ? undefined
              : (): void =>
                  handleChange({
                    ...fieldFilter,
                    isNot: !fieldFilter.isNot,
                  })
          }
        >
          {icons.ban}
        </Button.Small>
      )}
      {/**
       * REFACTOR: Add a property to queryFieldFilters to determine
       * FieldFilterTool component based on type
       */}
      {(['ageRange', 'ageName'] as RA<QueryFieldFilterType>).includes(
        fieldFilter.type
      ) ? (
        <AgeQueryFieldFilter
          fieldFilter={fieldFilter}
          onChange={handleChange}
        />
      ) : undefined}
    </>
  );
}

function AgeQueryFieldFilter({
  fieldFilter,
  onChange: handleChange,
}: Pick<FieldFilterToolProps, 'fieldFilter' | 'onChange'>): JSX.Element {
  return (
    <Button.Small
      aria-label={
        fieldFilter.isStrict ? queryText.strict() : queryText.nonStrict()
      }
      aria-pressed={fieldFilter.isStrict}
      className={className.ariaHandled}
      title={fieldFilter.isStrict ? queryText.strict() : queryText.nonStrict()}
      variant={className.secondaryLightButton}
      onClick={
        handleChange === undefined
          ? undefined
          : () =>
              handleChange({
                ...fieldFilter,
                isStrict: !fieldFilter.isStrict,
              })
      }
    >
      {fieldFilter.isStrict ? icons.strict : icons.nonStrict}
    </Button.Small>
  );
}
