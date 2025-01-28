import React from 'react';
import { useOutletContext } from 'react-router';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { useId } from '../../hooks/useId';
import { resourcesText } from '../../localization/resources';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { multiSortFunction, sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { isTreeTable } from '../InitialContext/treeRanks';
import { join } from '../Molecules';
import { mutateMappingPath } from '../WbPlanView/helpers';
import {
  getMappingLineProps,
  MappingElement,
  mappingElementDivider,
} from '../WbPlanView/LineComponents';
import { handleMappingLineKey } from '../WbPlanView/Mapper';
import {
  anyTreeRank,
  emptyMapping,
  formattedEntry,
  formatToManyIndex,
  formatTreeRank,
  getGenericMappingPath,
  mappingPathToString,
  parsePartialField,
  relationshipIsToMany,
  valueIsPartialField,
} from '../WbPlanView/mappingHelpers';
import type { MappingLineData } from '../WbPlanView/navigator';
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
  readonly value: LocalizedString | undefined;
  readonly type: 'aggregators' | 'formatters';
  readonly onChange: (value: LocalizedString) => void;
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

export function GenericFormatterPickList<
  ITEM extends {
    readonly title: LocalizedString | undefined;
    readonly table: SpecifyTable | undefined;
  },
>({
  table,
  value = localized(''),
  itemsPromise,
  onChange: handleChange,
}: {
  readonly table: SpecifyTable;
  readonly value: LocalizedString | undefined;
  readonly itemsPromise: Promise<IR<ITEM>>;
  readonly onChange: (value: LocalizedString) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const id = useId('formatters');
  const [allFormatters = {}] = usePromise(itemsPromise, false);
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
            ([_name, { title }]) => title ?? ''
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
  fieldFilter,
}: {
  readonly table: SpecifyTable;
  readonly mapping: GetSet<RA<LiteralField | Relationship> | undefined>;
  readonly openIndex: GetSet<number | undefined>;
  readonly isRequired?: boolean;
  readonly fieldFilter?: (mappingData: MappingLineData) => MappingLineData;
}): JSX.Element {
  const sourcePath = React.useMemo(() => {
    const rawPath =
      mapping?.map((field) => [
        field.name,
        ...(field.isRelationship && relationshipIsToMany(field)
          ? [formatToManyIndex(1)]
          : []),
        ...(field.isRelationship && isTreeTable(field.relatedTable.name)
          ? [formatTreeRank(anyTreeRank)]
          : []),
      ]) ?? [];
    const relationship = mapping?.at(-1);
    return filterArray([
      ...(isTreeTable(table.name) ? [formatTreeRank(anyTreeRank)] : []),
      ...rawPath.flat(),
      ...(rawPath.length === 0
        ? [emptyMapping]
        : relationship?.isRelationship === false
          ? []
          : [formattedEntry]),
    ]);
  }, [mapping, table.name]);
  const [mappingPath, setMappingPath] = React.useState(sourcePath);

  React.useEffect(() => {
    const isSamePath =
      mappingPathToString(
        mappingPath.at(-1) === emptyMapping
          ? mappingPath.slice(0, -1)
          : mappingPath
      ) ===
      mappingPathToString(
        sourcePath.at(-1) === formattedEntry
          ? sourcePath.slice(0, -1)
          : sourcePath
      );
    // Fix for https://github.com/specify/specify7/issues/3332
    if (!isSamePath) setMappingPath(sourcePath);
  }, [mappingPath, sourcePath]);

  const isReadOnly = React.useContext(ReadOnlyContext);
  const lineData = React.useMemo(() => {
    const data = getMappingLineData({
      baseTableName: table.name,
      mappingPath,
      showHiddenFields: true,
      generateFieldData: 'all',
      spec: navigatorSpecs.formatterEditor,
    });
    return typeof fieldFilter === 'function' ? data.map(fieldFilter) : data;
  }, [table.name, mappingPath, fieldFilter]);

  const validation = React.useMemo(
    () =>
      isRequired &&
      (mappingPath.length === 0 || mappingPath[0] === emptyMapping)
        ? [wbPlanText.mappingIsRequired()]
        : [],
    [mappingPath, isRequired]
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
            ignoreTreeRanks: true,
          });
          const purePath = getGenericMappingPath(
            path.map((part) =>
              valueIsPartialField(part) ? parsePartialField(part)[0] : part
            )
          );
          const inflatedPath = table.getFields(purePath.join('.'));
          const lastField = inflatedPath?.at(-1);
          setMappingPath(
            lastField?.isRelationship === true &&
              relationshipIsToMany(lastField) &&
              !navigatorSpecs.formatterEditor.allowTransientToMany
              ? [...path, formattedEntry]
              : path
          );
          setMapping(inflatedPath);
        },
    onOpen: setOpenIndex,
    onClose: () => setOpenIndex(undefined),
    openSelectElement: openIndex,
  });

  return (
    <Ul
      className="flex w-[100%] flex-wrap gap-2"
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
