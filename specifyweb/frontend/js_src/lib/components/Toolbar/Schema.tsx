/**
 * Data Model viewer
 */

import React from 'react';
import { useParams } from 'react-router-dom';

import type { SortConfigs } from '../../utils/cache/definitions';
import { f } from '../../utils/functools';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { welcomeText } from '../../localization/welcome';
import { wbText } from '../../localization/workbench';
import { getModel, schema } from '../DataModel/schema';
import {
  javaTypeToHuman,
  localizedRelationshipTypes,
} from '../SchemaConfig/helpers';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { getSystemInfo } from '../InitialContext/systemInfo';
import type { RA, RR } from '../../utils/types';
import { resolveParser, syncFieldFormat } from '../../utils/uiParse';
import { SortIndicator, TableIcon, useSortConfig } from '../Molecules';
import { softFail } from '../Errors/ErrorBoundary';
import { downloadFile } from '../Molecules/FilePicker';
import { formatNumber } from '../Atoms/Internationalization';
import { NotFoundView } from '../Router/NotFoundView';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Container, H2, H3 } from '../Atoms';

function Table<
  SORT_CONFIG extends
    | 'dataModelFields'
    | 'dataModelRelationships'
    | 'dataModelTables',
  FIELD_NAME extends SortConfigs[SORT_CONFIG]
>({
  sortName,
  headers,
  data: unsortedData,
  getLink,
}: {
  readonly sortName: SORT_CONFIG;
  readonly headers: RR<FIELD_NAME, string>;
  readonly data: RA<Row<FIELD_NAME>>;
  readonly getLink: ((row: Row<FIELD_NAME>) => string) | undefined;
}): JSX.Element {
  const indexColumn = Object.keys(headers)[0];
  const [sortConfig, handleSort, applySortConfig] = useSortConfig(
    sortName,
    'name'
  );
  const data = React.useMemo(
    () =>
      applySortConfig(unsortedData, (row) => {
        /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion */
        const data = row[sortConfig.sortField] as Value;
        return Array.isArray(data) ? data[0] : data;
      }),
    [sortConfig, unsortedData, applySortConfig]
  );
  return (
    <div
      className={`
        grid-table flex-1 grid-cols-[repeat(var(--cols),auto)] overflow-auto
        rounded border
      `}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">
        {Object.entries(headers).map(([name, label]) => (
          <div
            className="sticky top-0 border bg-[color:var(--background)] p-2 font-bold"
            key={name}
            role="columnheader"
          >
            <Button.LikeLink
              onClick={(): void => handleSort(name as FIELD_NAME)}
            >
              {label}
              <SortIndicator fieldName={name} sortConfig={sortConfig} />
            </Button.LikeLink>
          </div>
        ))}
      </div>
      <div role="rowgroup">
        {data.map((row) => {
          const children = Object.keys(headers).map((column) => {
            const data = row[column];
            return (
              <Cell key={column}>
                {Array.isArray(data) ? data[1] : row[column]}
              </Cell>
            );
          });
          const key = row[indexColumn]?.toString();
          const link = getLink?.(row);
          return typeof link === 'string' ? (
            <Link.Default href={link} key={key} role="row">
              {children}
            </Link.Default>
          ) : (
            <div key={key} role="row">
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Cell({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="border p-2" role="cell">
      {children}
    </div>
  );
}

const parser = f.store(() =>
  resolveParser(
    {},
    {
      type: 'java.lang.Boolean',
    }
  )
);

const booleanFormatter = (value: boolean): string =>
  syncFieldFormat(undefined, parser(), value);

/*
 * FEATURE: adapt this page for printing
 */

export function DataModelTable(): JSX.Element {
  const { tableName = '' } = useParams();
  const model = getModel(tableName);
  return model === undefined ? (
    <NotFoundView />
  ) : (
    <Container.Full>
      <DataModelFields model={model} />
      <DataModelRelationships model={model} />
    </Container.Full>
  );
}

const fieldColumns = {
  name: commonText('name'),
  label: commonText('label'),
  description: commonText('description'),
  isHidden: commonText('hidden'),
  isReadOnly: commonText('readOnly'),
  isRequired: commonText('required'),
  type: commonText('type'),
  length: commonText('length'),
  databaseColumn: commonText('databaseColumn'),
} as const;

type Value =
  | number
  | string
  | readonly [number | string | undefined, JSX.Element]
  | undefined;
type Row<COLUMNS extends string> = RR<COLUMNS, Value>;
const getFields = (model: SpecifyModel): RA<Row<keyof typeof fieldColumns>> =>
  model.literalFields.map((field) => ({
    name: field.name,
    label: field.label,
    description: field.getLocalizedDesc(),
    isHidden: booleanFormatter(field.isHidden),
    isReadOnly: booleanFormatter(field.isReadOnly),
    isRequired: booleanFormatter(field.isRequired),
    type: javaTypeToHuman(field.type, undefined),
    length: [
      field.length,
      <span className="flex w-full justify-end tabular-nums">
        {f.maybe(field.length, formatNumber)}
      </span>,
    ],
    databaseColumn: field.databaseColumn,
  }));

function DataModelFields({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getFields(model), [model]);
  return (
    <>
      <div className="flex items-center gap-2">
        <TableIcon label={false} name={model.name} />
        <H2 className="text-2xl">{model.name}</H2>
      </div>
      <H3>{commonText('fields')}</H3>
      <Table
        data={data}
        getLink={undefined}
        headers={fieldColumns}
        sortName="dataModelFields"
      />
    </>
  );
}

const relationshipColumns = {
  name: commonText('name'),
  label: commonText('label'),
  description: commonText('description'),
  isHidden: commonText('hidden'),
  isReadOnly: commonText('readOnly'),
  isRequired: commonText('required'),
  type: commonText('type'),
  databaseColumn: commonText('databaseColumn'),
  relatedModel: commonText('relatedModel'),
  otherSideName: commonText('otherSideName'),
  isDependent: commonText('dependent'),
} as const;

const getRelationships = (
  model: SpecifyModel
): RA<Row<keyof typeof relationshipColumns>> =>
  model.relationships.map((field) => ({
    name: field.name,
    label: field.label,
    description: field.getLocalizedDesc(),
    isHidden: booleanFormatter(field.isHidden),
    isReadOnly: booleanFormatter(field.isReadOnly),
    isRequired: booleanFormatter(field.isRequired),
    type: localizedRelationshipTypes[field.type] ?? field.type,
    databaseColumn: field.databaseColumn,
    relatedModel: [
      field.relatedModel.name.toLowerCase(),
      <>
        <TableIcon label={false} name={field.relatedModel.name} />
        {field.relatedModel.name}
      </>,
    ],
    otherSideName: field.otherSideName,
    isDependent: booleanFormatter(field.isDependent()),
  }));

function DataModelRelationships({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getRelationships(model), [model]);
  return (
    <>
      <H3>{commonText('relationships')}</H3>
      <Table
        data={data}
        getLink={({ relatedModel }): string =>
          `/specify/datamodel/${
            (relatedModel as readonly [string, JSX.Element])[0]
          }/`
        }
        headers={relationshipColumns}
        sortName="dataModelRelationships"
      />
    </>
  );
}

const tableColumns = {
  name: commonText('name'),
  label: commonText('label'),
  isSystem: commonText('system'),
  isHidden: commonText('hidden'),
  tableId: commonText('tableId'),
  fieldCount: commonText('fieldCount'),
  relationshipCount: commonText('relationshipCount'),
} as const;
const getTables = (): RA<Row<keyof typeof tableColumns>> =>
  Object.values(schema.models).map((model) => ({
    name: [
      model.name.toLowerCase(),
      <>
        <TableIcon label={false} name={model.name} />
        {model.name}
      </>,
    ],
    label: model.label,
    isSystem: booleanFormatter(model.isSystem),
    isHidden: booleanFormatter(model.isHidden),
    tableId: [
      model.tableId,
      <span className="flex w-full justify-end tabular-nums">
        {model.tableId}
      </span>,
    ],
    fieldCount: [
      model.fields.length,
      <span className="flex w-full justify-end tabular-nums">
        {formatNumber(model.fields.length)}
      </span>,
    ],
    relationshipCount: [
      model.relationships.length,
      <span className="flex w-full justify-end tabular-nums">
        {formatNumber(model.relationships.length)}
      </span>,
    ],
  }));

export function DataModelTables(): JSX.Element {
  const tables = React.useMemo(getTables, []);
  return (
    <Container.Full>
      <div className="flex items-center gap-2">
        <H2 className="text-2xl">
          {`${welcomeText('schemaVersion')} ${getSystemInfo().schema_version}`}
        </H2>
        <span className="-ml-2 flex-1" />
        <Link.Green
          className="print:hidden"
          download
          href="/context/datamodel.json"
        >
          {commonText('downloadAsJson')}
        </Link.Green>
        <Button.Green
          className="print:hidden"
          onClick={(): void =>
            void downloadFile(
              `Specify 7 datamodel - v${getSystemInfo().schema_version}.tsv`,
              dataModelToTsv()
            ).catch(softFail)
          }
        >
          {commonText('downloadAsTsv')}
        </Button.Green>
      </div>
      <Table
        data={tables}
        getLink={({ name }): string =>
          `/specify/datamodel/${(name as readonly [string, JSX.Element])[0]}/`
        }
        headers={tableColumns}
        sortName="dataModelTables"
      />
    </Container.Full>
  );
}

const dataModelToTsv = (): string =>
  [
    [
      adminText('table'),
      commonText('label'),
      commonText('system'),
      commonText('hidden'),
      commonText('tableId'),
      commonText('name'),
      commonText('label'),
      commonText('description'),
      commonText('hidden'),
      commonText('readOnly'),
      commonText('required'),
      wbText('relationshipInline'),
      commonText('type'),
      commonText('length'),
      commonText('databaseColumn'),
      commonText('relatedModel'),
      commonText('otherSideName'),
      commonText('dependent'),
    ],
    ...Object.values(schema.models).flatMap((model) =>
      f.var(
        [
          model.name,
          model.label,
          booleanFormatter(model.isSystem),
          booleanFormatter(model.isHidden),
          model.tableId,
        ],
        (commonColumns) => [
          ...model.literalFields.map((field) => [
            ...commonColumns,
            field.name,
            field.label,
            field.getLocalizedDesc(),
            booleanFormatter(field.isHidden),
            booleanFormatter(field.isReadOnly),
            booleanFormatter(field.isRequired),
            booleanFormatter(false),
            javaTypeToHuman(field.type, undefined),
            field.length,
            field.databaseColumn,
            '',
            '',
            '',
          ]),
          ...model.relationships.map((relationship) => [
            ...commonColumns,
            relationship.name,
            relationship.label,
            relationship.getLocalizedDesc(),
            booleanFormatter(relationship.isHidden),
            booleanFormatter(relationship.isReadOnly),
            booleanFormatter(relationship.isRequired),
            booleanFormatter(true),
            localizedRelationshipTypes[relationship.type] ?? relationship.type,
            '',
            relationship.databaseColumn,
            relationship.relatedModel.name,
            relationship.otherSideName,
            booleanFormatter(relationship.isDependent()),
          ]),
        ]
      )
    ),
  ]
    .map((line) => line.join('\t'))
    .join('\n');
