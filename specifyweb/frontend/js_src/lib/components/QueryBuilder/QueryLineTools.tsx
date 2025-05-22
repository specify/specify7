import React from 'react';

import { localityText } from '../../localization/locality';
import { queryText } from '../../localization/query';
import type { Parser } from '../../utils/parser/definitions';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { IsQueryBasicContext } from './Context';
import type { QueryFieldType } from './FieldFilter';
import type { QueryField } from './helpers';
import { sortTypes } from './helpers';

export function QueryLineTools({
  fieldMeta,
  onOpenMap: handleOpenMap,
  field,
  isFieldComplete,
  onChange: handleChange,
  onMoveUp: handleMoveUp,
  onMoveDown: handleMoveDown,
}: {
  readonly fieldMeta: {
    readonly fieldType: QueryFieldType | undefined;
    readonly parser: Parser | undefined;
    readonly canOpenMap: boolean;
  };
  readonly onOpenMap: (() => void) | undefined;
  readonly field: QueryField;
  readonly isFieldComplete: boolean;
  readonly onChange: ((newField: QueryField) => void) | undefined;
  readonly onMoveUp: (() => void) | undefined;
  readonly onMoveDown: (() => void) | undefined;
}): JSX.Element {
  const isBasic = React.useContext(IsQueryBasicContext);
  return (
    <div
      className={`
       ${isBasic ? 'flex h-full items-center justify-end gap-2' : 'contents'} 
       print:hidden
      `}
    >
      {fieldMeta.canOpenMap && typeof handleOpenMap === 'function' ? (
        <Button.Small
          aria-label={localityText.openMap()}
          className={isBasic ? 'h-full' : ''}
          title={localityText.openMap()}
          variant={className.infoButton}
          onClick={handleOpenMap}
        >
          {icons.locationMarker}
        </Button.Small>
      ) : undefined}
      <Button.Small
        aria-label={queryText.showButtonDescription()}
        aria-pressed={field.isDisplay}
        className={`
          ${className.ariaHandled} 
          ${isFieldComplete ? '' : 'invisible'} 
          ${isBasic ? 'h-full' : ''}
        `}
        title={queryText.showButtonDescription()}
        variant={
          field.isDisplay
            ? className.successButton
            : className.secondaryLightButton
        }
        onClick={handleChange?.bind(undefined, {
          ...field,
          isDisplay: !field.isDisplay,
        })}
      >
        {icons.check}
      </Button.Small>
      <Button.Small
        aria-label={
          field.sortType === 'ascending'
            ? queryText.ascendingSort()
            : field.sortType === 'descending'
              ? queryText.descendingSort()
              : queryText.sort()
        }
        className={`
         ${isFieldComplete ? '' : 'invisible'} ${isBasic ? 'h-full' : ''}
        `}
        title={
          field.sortType === 'ascending'
            ? queryText.ascendingSort()
            : field.sortType === 'descending'
              ? queryText.descendingSort()
              : queryText.sort()
        }
        onClick={handleChange?.bind(undefined, {
          ...field,
          sortType:
            sortTypes[
              (sortTypes.indexOf(field.sortType) + 1) % sortTypes.length
            ],
        })}
      >
        {field.sortType === 'ascending'
          ? icons.arrowCircleUp
          : field.sortType === 'descending'
            ? icons.arrowCircleDown
            : icons.circle}
      </Button.Small>
      <Button.Small
        aria-label={queryText.moveUp()}
        className={`${isBasic ? '!block h-full' : ''} hidden sm:block`}
        title={queryText.moveUp()}
        onClick={handleMoveUp}
      >
        {icons.chevronUp}
      </Button.Small>
      <Button.Small
        aria-label={queryText.moveDown()}
        className={`${isBasic ? '!block h-full' : ''} hidden sm:block`}
        title={queryText.moveDown()}
        onClick={handleMoveDown}
      >
        {icons.chevronDown}
      </Button.Small>
    </div>
  );
}
