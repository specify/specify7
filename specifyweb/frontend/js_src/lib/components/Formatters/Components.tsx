import { filterArray, GetSet, RA } from '../../utils/types';
import { Formatter } from './spec';
import { fetchFormatters } from './dataObjFormatters';
import { useId } from '../../hooks/useId';
import { useAsyncState } from '../../hooks/useAsyncState';
import { Input, Label } from '../Atoms/Form';
import { resourcesText } from '../../localization/resources';
import { SpecifyModel } from '../DataModel/specifyModel';
import { LiteralField, Relationship } from '../DataModel/specifyField';
import { AllowedMappings, getMappingLineData } from '../WbPlanView/navigator';
import { emptyMapping, mutateMappingPath } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import { mutateLineData } from '../QueryBuilder/helpers';
import { Ul } from '../Atoms';
import { handleMappingLineKey } from '../WbPlanView/Mapper';
import { f } from '../../utils/functools';
import { join } from '../Molecules';
import React from 'react';

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
  readonly allowedMappings: AllowedMappings;
  readonly openIndex: GetSet<number | undefined>;
}): JSX.Element {
  const rawPath = mapping?.map(({ name }) => name) ?? [];
  const mappingPath = filterArray([
    ...rawPath,
    mapping?.at(-1)?.isRelationship === false ? undefined : emptyMapping,
  ]);
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
    customSelectType: 'CLOSED_LIST',
    onChange: isReadOnly
      ? undefined
      : (payload): void =>
          setMapping(
            table.getFields(
              mutateMappingPath({ ...payload, mappingPath })
                .filter((item) => item !== emptyMapping)
                .join('.')
            )
          ),
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
