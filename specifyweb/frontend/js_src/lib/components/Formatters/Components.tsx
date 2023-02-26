import React from 'react';
import { useOutletContext } from 'react-router';

import { usePromise } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { resourcesText } from '../../localization/resources';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { multiSortFunction, sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchContext as fetchFieldFormatters } from '../FieldFormatters';
import { join } from '../Molecules';
import { emptyMapping, mutateMappingPath } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import { handleMappingLineKey } from '../WbPlanView/Mapper';
import {
  formattedEntry,
  formatToManyIndex,
  parsePartialField,
  relationshipIsToMany,
  valueIsPartialField,
  valueIsToManyIndex,
  valueIsTreeRank,
} from '../WbPlanView/mappingHelpers';
import { getMappingLineData } from '../WbPlanView/navigator';
import { navigatorSpecs } from '../WbPlanView/navigatorSpecs';
import type { Aggregator, Formatter } from './spec';
import type { FormatterTypesOutlet } from './Types';

export function FormattersPickList({
  table,
  value,
  type,
  onChange: handleChange,
}: {
  readonly table: SpecifyTable | undefined;
  readonly value: string | undefined;
  readonly type: 'aggregators' | 'formatters';
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const id = useId('formatters');
  const { parsed } = useOutletContext<FormatterTypesOutlet>();
  const allFormatters: RA<Aggregator | Formatter> = parsed[type];
  const formatters = React.useMemo(
    () =>
      allFormatters
        .filter((formatter) => formatter.table === table)
        .sort(sortFunction(({ title }) => title)),
    [allFormatters, table]
  );

  return (
    <>
      <Input.Text
        isReadOnly={isReadOnly}
        list={id('list')}
        min={0}
        placeholder={resourcesText.defaultInline()}
        step={1}
        value={value ?? ''}
        onValueChange={handleChange}
      />
      <datalist id={id('list')}>
        {formatters.map((formatter, index) => (
          <option key={index} value={formatter.name}>
            {formatter.title ?? formatter.name}
          </option>
        ))}
      </datalist>
    </>
  );
}

export function FieldFormattersPickList({
  table,
  value,
  onChange: handleChange,
}: {
  readonly table: SpecifyTable;
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const id = useId('formatters');
  const [allFormatters = {}] = usePromise(fetchFieldFormatters, false);
  const formatters = React.useMemo(
    () =>
      Object.entries(allFormatters)
        .filter(
          ([_name, formatter]) =>
            formatter.table === undefined || formatter.table === table
        )
        .sort(
          multiSortFunction(
            ([_name, { table }]) => typeof table === 'object',
            true,
            ([_name, { title }]) => title
          )
        ),
    [allFormatters, table]
  );

  return (
    <>
      <Input.Text
        isReadOnly={isReadOnly}
        list={id('list')}
        min={0}
        placeholder={resourcesText.defaultInline()}
        step={1}
        value={value}
        onValueChange={handleChange}
      />
      <datalist id={id('list')}>
        {formatters.map(([name, formatter]) => (
          <option key={name} value={name}>
            {formatter.title ?? name}
          </option>
        ))}
      </datalist>
    </>
  );
}

export function ResourceMapping({
  table,
  mapping: [mapping, setMapping],
  openIndex: [openIndex, setOpenIndex],
  isRequired = false,
}: {
  readonly table: SpecifyTable;
  readonly mapping: GetSet<RA<LiteralField | Relationship> | undefined>;
  readonly openIndex: GetSet<number | undefined>;
  readonly isRequired?: boolean;
}): JSX.Element {
  // Note, this assumes the "mapping" prop can only be changed by this component
  const [mappingPath, setMappingPath] = React.useState(() => {
    const rawPath = mapping?.map(({ name }) => name) ?? [];
    const relationship = mapping?.at(-1);
    return filterArray([
      ...rawPath,
      ...(rawPath.length === 0
        ? [emptyMapping]
        : relationship?.isRelationship === false
        ? []
        : relationshipIsToMany(relationship)
        ? [formatToManyIndex(1), formattedEntry]
        : [formattedEntry]),
    ]);
  });

  const isReadOnly = React.useContext(ReadOnlyContext);
  const lineData = React.useMemo(
    () =>
      getMappingLineData({
        baseTableName: table.name,
        mappingPath,
        showHiddenFields: true,
        generateFieldData: 'all',
        spec: navigatorSpecs.formatterEditor,
      }),
    [table.name, mappingPath]
  );

  const validation = React.useMemo(
    () =>
      isRequired &&
      (mappingPath.length === 0 || mappingPath[0] === emptyMapping)
        ? [wbPlanText.mappingIsRequired()]
        : [],
    [lineData, mappingPath, isRequired]
  );

  const mappingLineProps = getMappingLineProps({
    mappingLineData: lineData,
    customSelectType: 'SIMPLE_LIST',
    onChange: isReadOnly
      ? undefined
      : (payload): void => {
          const path = mutateMappingPath({
            ...payload,
            mappingPath,
            ignoreToMany: true,
          });
          setMappingPath(path);
          const purePath = path
            .map((part) =>
              valueIsPartialField(part) ? parsePartialField(part)[0] : part
            )
            .filter(
              (part) =>
                part !== emptyMapping &&
                part !== formattedEntry &&
                !valueIsToManyIndex(part) &&
                !valueIsTreeRank(part)
            );
          setMapping(table.getFields(purePath.join('.')));
        },
    onOpen: setOpenIndex,
    onClose: () => setOpenIndex(undefined),
    openSelectElement: openIndex,
  });

  return (
    <Ul
      className="flex flex-wrap gap-2"
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
        mappingLineProps.map((mappingDetails, index) => (
          <li className="contents" key={index}>
            <MappingElement
              {...mappingDetails}
              validation={validation[index]}
            />
          </li>
        )),
        mappingElementDivider
      )}
    </Ul>
  );
}
