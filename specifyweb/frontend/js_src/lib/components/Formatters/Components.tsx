import React from 'react';
import { useOutletContext } from 'react-router';

import { usePromise } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { resourcesText } from '../../localization/resources';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Ul } from '../Atoms';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { fetchContext as fetchFieldFormatters } from '../FieldFormatters';
import { join } from '../Molecules';
import { mutateLineData } from '../QueryBuilder/helpers';
import { emptyMapping, mutateMappingPath } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import { handleMappingLineKey } from '../WbPlanView/Mapper';
import {
  formattedEntry,
  relationshipIsToMany,
} from '../WbPlanView/mappingHelpers';
import { getMappingLineData } from '../WbPlanView/navigator';
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
    () => allFormatters.filter((formatter) => formatter.table === table),
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
  value,
  onChange: handleChange,
}: {
  readonly value: string | undefined;
  readonly onChange: (value: string) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const id = useId('formatters');
  const [formatters] = usePromise(fetchFieldFormatters, false);

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
        {Object.entries(formatters ?? {}).map(([name, formatter]) => (
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
  isReadOnly,
  openIndex: [openIndex, setOpenIndex],
  isRequired,
}: {
  readonly table: SpecifyTable;
  readonly mapping: GetSet<RA<LiteralField | Relationship> | undefined>;
  readonly isReadOnly: boolean;
  readonly openIndex: GetSet<number | undefined>;
  readonly isRequired?: boolean;
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

  const validation = React.useMemo(
    () =>
      mapping === undefined || mapping.length === 0
        ? [wbPlanText.mappingIsRequired()]
        : mapping.map((field, index, { length }) =>
            field.isRelationship &&
            relationshipIsToMany(field) &&
            index < length - 1
              ? wbPlanText.transientToManyNotAllowed()
              : undefined
          ),
    [mapping, isRequired]
  );

  const lineData = getMappingLineData({
    baseTableName: table.name,
    mappingPath,
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
        mappingLineProps.map((mappingDetails, index) => (
          <li key={index} className="contents">
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
