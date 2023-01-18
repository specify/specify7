import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Ul } from '../Atoms';
import { Input, Label } from '../Atoms/Form';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { join } from '../Molecules';
import { mutateLineData } from '../QueryBuilder/helpers';
import { emptyMapping, mutateMappingPath } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import { handleMappingLineKey } from '../WbPlanView/Mapper';
import type { FieldType } from '../WbPlanView/mappingHelpers';
import { formattedEntry } from '../WbPlanView/mappingHelpers';
import { getMappingLineData } from '../WbPlanView/navigator';
import { fetchFormatters } from './dataObjFormatters';
import type { Formatter } from './spec';

const formattersFunction = async (): Promise<RA<Formatter>> =>
  fetchFormatters.then(({ formatters }) => formatters);

export function FormattersPickList({
  isReadOnly,
  value,
  onChange: handleChange,
}: {
  readonly isReadOnly: boolean;
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const id = useId('formatters');
  // FIXME: add a warning when editing resources from a different collection
  const [formatters] = useAsyncState(formattersFunction, false);
  return (
    <Label.Block>
      {resourcesText.formatter()}
      <Input.Text
        isReadOnly={isReadOnly}
        list={id('list')}
        min={0}
        step={1}
        value={value}
        onValueChange={handleChange}
      />
      <datalist id={id('list')}>
        {formatters?.map((formatter, index) => (
          <option key={index} value={formatter.name}>
            {formatter.title ?? formatter.name}
          </option>
        ))}
      </datalist>
    </Label.Block>
  );
}

export function ResourceMapping({
  table,
  mapping: [mapping, setMapping],
  isReadOnly,
  allowedMappings,
  openIndex: [openIndex, setOpenIndex],
}: {
  readonly table: SpecifyModel;
  readonly mapping: GetSet<RA<LiteralField | Relationship> | undefined>;
  readonly isReadOnly: boolean;
  readonly allowedMappings: RA<FieldType>;
  readonly openIndex: GetSet<number | undefined>;
}): JSX.Element {
  // Note, this assumes the "mapping" prop can only be changed by this component
  const [mappingPath, setMappingPath] = React.useState(() => {
    const rawPath = mapping?.map(({ name }) => name) ?? [];
    return filterArray([
      ...rawPath,
      rawPath.length === 0
        ? emptyMapping
        : mapping?.at(-1)?.isRelationship === false
        ? undefined
        : formattedEntry,
    ]);
  });

  const lineData = getMappingLineData({
    baseTableName: table.name,
    mappingPath,
    allowedRelationships: allowedMappings,
    showHiddenFields: true,
    generateFieldData: 'all',
    scope: 'queryBuilder',
  });

  const mappingLineProps = getMappingLineProps({
    mappingLineData: mutateLineData(lineData),
    customSelectType: 'SIMPLE_LIST',
    onChange: isReadOnly
      ? undefined
      : (payload): void => {
          const path = mutateMappingPath({ ...payload, mappingPath });
          setMappingPath(path);
          const purePath = path.filter(
            (part) => part !== emptyMapping && part !== formattedEntry
          );
          setMapping(table.getFields(purePath.join('.')));
        },
    onOpen: setOpenIndex,
    onClose: () => setOpenIndex(undefined),
    openSelectElement: openIndex,
  });

  return (
    <Ul
      className="flex gap-2"
      onKeyDown={({ key }): void =>
        handleMappingLineKey({
          key,
          openedElement: openIndex,
          lineLength: mappingLineProps.length,
          onOpen: setOpenIndex,
          onClose: () => setOpenIndex(undefined),
          onFocusPrevious: f.void,
          onFocusNext: f.void,
        })
      }
    >
      {join(
        mappingLineProps.map((mappingDetails) => (
          <MappingElement {...mappingDetails} role="listitem" />
        )),
        mappingElementDivider
      )}
    </Ul>
  );
}
