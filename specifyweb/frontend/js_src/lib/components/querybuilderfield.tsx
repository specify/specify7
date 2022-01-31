import React from 'react';

import type { Tables } from '../datamodel';
import commonText from '../localization/common';
import queryText from '../localization/query';
import type { QueryField } from '../querybuilderutils';
import { getMappingLineData } from '../wbplanviewnavigator';
import { mutateMappingPath } from '../wbplanviewutils';
import { Button, className } from './basic';
import { icons } from './icons';
import { MappingPathComponent } from './wbplanviewcomponents';

export function QueryLine({
  baseTableName,
  field,
  forReport = false,
  onChange: handleChange,
  onRemove: handleRemove,
  onOpen: handleOpen,
  onClose: handleClose,
  onLineFocus: handleLineFocus,
  isFocused,
  openedElement,
  showHiddenFields,
}: {
  readonly baseTableName: Lowercase<keyof Tables>;
  readonly field: QueryField;
  readonly forReport?: boolean;
  readonly onChange: (newField: QueryField) => void;
  readonly onRemove: () => void;
  readonly onOpen: (index: number) => void;
  readonly onClose: () => void;
  readonly onLineFocus: (target: 'previous' | 'current' | 'next') => void;
  readonly isFocused: boolean;
  readonly openedElement: number | undefined;
  readonly showHiddenFields: boolean;
}): JSX.Element {
  const lineRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (isFocused && lineRef.current?.contains(document.activeElement) !== true)
      lineRef.current?.focus();
  }, [isFocused]);

  const lineData = getMappingLineData({
    baseTableName,
    mappingPath: field.mappingPath,
    generateLastRelationshipData: true,
    iterate: true,
    customSelectType: 'CLOSED_LIST',
    handleChange: (payload): void =>
      handleChange({
        ...field,
        mappingPath: mutateMappingPath({
          lines: [],
          mappingView: field.mappingPath,
          line: 'mappingView',
          index: payload.index,
          newValue: payload.newValue,
          isRelationship: payload.isRelationship,
          currentTableName: payload.currentTableName,
          newTableName: payload.newTableName,
        }),
      }),
    handleOpen,
    // TODO: detect outside click
    handleClose,
    openSelectElement: openedElement,
    showHiddenFields,
  });

  return (
    <li
      className="border-t-gray-500 gap-x-2 flex py-2 border-t"
      aria-current={isFocused}
    >
      <Button.Simple
        className={`${className.redButton} print:hidden`}
        title={commonText('remove')}
        aria-label={commonText('remove')}
        onClick={handleRemove}
      >
        {icons.trash}
      </Button.Simple>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className={`flex-1 print:gap-1 flex flex-wrap items-center gap-2 ${
          isFocused ? 'bg-gray-300 dark:bg-neutral-700' : ''
        }`}
        role="list"
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        onClick={(): void => handleLineFocus('current')}
        // TODO: deduplicate this logic here and in mapping view
        onKeyDown={({ key }): void => {
          if (typeof openedElement === 'number') {
            if (key === 'ArrowLeft')
              if (openedElement > 0) handleOpen(openedElement - 1);
              else handleClose();
            else if (key === 'ArrowRight')
              if (openedElement + 1 < lineData.length)
                handleOpen(openedElement + 1);
              else handleClose();

            return;
          }

          if (key === 'ArrowLeft') handleOpen(lineData.length - 1);
          else if (key === 'ArrowRight' || key === 'Enter') handleOpen(0);
          else if (key === 'ArrowUp') handleLineFocus('previous');
          else if (key === 'ArrowDown') handleLineFocus('next');
        }}
        ref={lineRef}
      >
        <MappingPathComponent mappingLineData={lineData} />
      </div>
      <div className="contents print:hidden">
        <Button.Simple
          title={queryText('negate')}
          aria-label={queryText('negate')}
          className={`
        aria-handled
        op-negate
        field-state-hide
        operation-state-show
        datepart-state-hide
      `}
          aria-pressed={false}
        >
          {icons.ban}
        </Button.Simple>
        <Button.Simple
          title={queryText('showButtonDescription')}
          aria-label={queryText('showButtonDescription')}
          aria-pressed={false}
          className="field-show button aria-handled"
        >
          {icons.check}
        </Button.Simple>
        <Button.Simple title={queryText('sort')} aria-label={queryText('sort')}>
          {icons.stop}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveUp')}
          aria-label={queryText('moveUp')}
        >
          {icons.chevronUp}
        </Button.Simple>
        <Button.Simple
          title={queryText('moveDown')}
          aria-label={queryText('moveDown')}
        >
          {icons.chevronDown}
        </Button.Simple>
      </div>
    </li>
  );
}
