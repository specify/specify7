import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import type { Parser } from '../../utils/parser/definitions';
import { removeKey } from '../../utils/utils';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import { fetchPickList, getPickListItems } from '../PickLists/fetch';
import { mappingElementDivider } from '../WbPlanView/LineComponents';
import { IsQueryBasicContext } from './Context';
import { resolvePickListItem } from './FieldFilterSpec';
import type { QueryField } from './helpers';
import { useQueryFieldFilterSpecs } from './useQueryFieldFilterSpecs';

export function QueryLineFilter({
  filter,
  fieldName,
  terminatingField,
  parser: originalParser,
  enforceLengthLimit,
  onChange: handleChange,
}: {
  readonly filter: QueryField['filters'][number];
  readonly fieldName: string;
  readonly terminatingField: LiteralField | Relationship | undefined;
  readonly parser: Parser;
  readonly enforceLengthLimit: boolean;
  readonly onChange: ((newValue: string) => void) | undefined;
}): JSX.Element | null {
  const queryFieldFilterSpecs = useQueryFieldFilterSpecs();

  const parser = queryFieldFilterSpecs[filter.type].hasParser
    ? originalParser
    : ({
        ...removeKey(
          originalParser,
          'pattern',
          'min',
          'step',
          'formatters',
          'parser',
          'validators'
        ),
        type: 'text',
      } as const);

  const [pickListItems] = useAsyncState(
    React.useCallback(
      async () =>
        typeof parser.pickListName === 'string'
          ? fetchPickList(parser.pickListName).then((pickList) =>
              typeof pickList === 'object' ? getPickListItems(pickList) : false
            )
          : false,
      [parser.pickListName]
    ),
    false
  );

  // Fix for https://github.com/specify/specify7/issues/2296
  React.useEffect(() => {
    if (pickListItems === undefined || pickListItems === false) return;
    const newStartValue = filter.startValue
      .split(',')
      .map((value) => resolvePickListItem(pickListItems, value))
      .join(',');
    if (newStartValue !== filter.startValue) handleChange?.(newStartValue);
  }, [pickListItems, filter]);

  const Component = queryFieldFilterSpecs[filter.type].component;

  const isBasic = React.useContext(IsQueryBasicContext);

  return Component === undefined ? null : pickListItems === undefined ? (
    <>{commonText.loading()}</>
  ) : (
    <>
      {isBasic ? null : mappingElementDivider}
      <Component
        currentValue={filter.startValue}
        enforceLengthLimit={enforceLengthLimit}
        fieldName={fieldName}
        parser={parser}
        pickListItems={
          queryFieldFilterSpecs[filter.type].renderPickList
            ? pickListItems === false
              ? undefined
              : pickListItems
            : undefined
        }
        terminatingField={terminatingField}
        onChange={handleChange}
      />
    </>
  );
}
