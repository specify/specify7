/**
 * Data Model viewer
 */

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { SortConfigs } from '../../utils/cache/definitions';
import { f } from '../../utils/functools';
import { welcomeText } from '../../localization/welcome';
import { getModel, schema } from '../DataModel/schema';
import {
  javaTypeToHuman,
  localizedRelationshipTypes,
} from '../SchemaConfig/helpers';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { getSystemInfo } from '../InitialContext/systemInfo';
import type { RA, RR } from '../../utils/types';
import { resolveParser } from '../../utils/parser/definitions';
import { downloadFile } from '../Molecules/FilePicker';
import { formatNumber } from '../Atoms/Internationalization';
import { NotFoundView } from '../Router/NotFoundView';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { Container, H2, H3 } from '../Atoms';
import { softFail } from '../Errors/Crash';
import { TableIcon } from '../Molecules/TableIcon';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { formsText } from '../../localization/forms';
import { schemaText } from '../../localization/schema';
import { LocalizedString } from 'typesafe-i18n';
import { getField } from '../DataModel/helpers';
import { Tables } from '../DataModel/types';
import { useActiveCategory, useFrozenCategory } from '../UserPreferences/Aside';
import { locationToState } from '../Router/RouterState';

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
  className,
}: {
  readonly sortName: SORT_CONFIG;
  readonly headers: RR<FIELD_NAME, LocalizedString>;
  readonly data: RA<Row<FIELD_NAME>>;
  readonly getLink: ((row: Row<FIELD_NAME>) => string) | undefined;
  readonly className?: string | undefined;
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
        grid-table
        w-fit flex-1 grid-cols-[repeat(var(--cols),auto)] rounded border border-gray-400 dark:border-neutral-500
      ${className}`}
      role="table"
      style={{ '--cols': Object.keys(headers).length } as React.CSSProperties}
    >
      <div role="row">
        {Object.entries(headers).map(([name, label]) => (
          <div
            className={`
              sticky top-0 border border-gray-400 bg-[color:var(--background)]
              p-2 font-bold dark:border-neutral-500
            `}
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
    <div
      className="border border-gray-400 p-2 dark:border-neutral-500"
      role="cell"
    >
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

function DataModelTable({
  tableName,
  forwardRef,
}: {
  readonly tableName: keyof Tables;
  readonly forwardRef?: (element: HTMLElement | null) => void;
}): JSX.Element {
  const model = getModel(tableName);
  return model === undefined ? (
    <NotFoundView />
  ) : (
    <section className="flex flex-col gap-4" ref={forwardRef}>
      <DataModelFields model={model} />
      <DataModelRelationships model={model} />
    </section>
  );
}

const fieldColumns = f.store(
  () =>
    ({
      name: getField(schema.models.SpLocaleContainerItem, 'name').label,
      label: schemaText.fieldLabel(),
      description: schemaText.description(),
      isHidden: getField(schema.models.SpLocaleContainerItem, 'isHidden').label,
      isReadOnly: schemaText.readOnly(),
      isRequired: getField(schema.models.SpLocaleContainerItem, 'isRequired')
        .label,
      type: getField(schema.models.SpLocaleContainerItem, 'type').label,
      length: schemaText.fieldLength(),
      databaseColumn: schemaText.databaseColumn(),
    } as const)
);

type Value =
  | number
  | string
  | readonly [number | string | undefined, JSX.Element]
  | undefined;
type Row<COLUMNS extends string> = RR<COLUMNS, Value>;
const getFields = (
  model: SpecifyModel
): RA<Row<keyof ReturnType<typeof fieldColumns>>> =>
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
        <H2 id={model.name.toLowerCase()} className="text-2xl">
          {model.name}
        </H2>
      </div>
      <H3>{schemaText.fields()}</H3>
      <Table
        data={data}
        // className={'overflow-auto'}
        getLink={undefined}
        headers={fieldColumns()}
        sortName="dataModelFields"
      />
    </>
  );
}

const relationshipColumns = f.store(
  () =>
    ({
      name: getField(schema.models.SpLocaleContainerItem, 'name').label,
      label: schemaText.fieldLabel(),
      description: schemaText.description(),
      isHidden: getField(schema.models.SpLocaleContainerItem, 'isHidden').label,
      isReadOnly: schemaText.readOnly(),
      isRequired: getField(schema.models.SpLocaleContainerItem, 'isRequired')
        .label,
      type: getField(schema.models.SpLocaleContainerItem, 'type').label,
      databaseColumn: schemaText.databaseColumn(),
      relatedModel: schemaText.relatedModel(),
      otherSideName: schemaText.otherSideName(),
      isDependent: schemaText.dependent(),
    } as const)
);

const getRelationships = (
  model: SpecifyModel
): RA<Row<keyof ReturnType<typeof relationshipColumns>>> =>
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
      <H3 id={model.name.toLowerCase()}>{schemaText.relationships()}</H3>
      <Table
        data={data}
        getLink={({ relatedModel }): string =>
          `#${(relatedModel as readonly [string, JSX.Element])[0]}`
        }
        headers={relationshipColumns()}
        sortName="dataModelRelationships"
        // className={'overflow-auto'}
      />
    </>
  );
}

export const tableColumns = f.store(
  () =>
    ({
      name: getField(schema.models.SpLocaleContainer, 'name').label,
      label: schemaText.fieldLabel(),
      isSystem: getField(schema.models.SpLocaleContainer, 'isSystem').label,
      isHidden: getField(schema.models.SpLocaleContainer, 'isHidden').label,
      tableId: schemaText.tableId(),
      fieldCount: schemaText.fieldCount(),
      relationshipCount: schemaText.relationshipCount(),
    } as const)
);
export const getTables = (): RA<Row<keyof ReturnType<typeof tableColumns>>> =>
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
  const { visibleChild, forwardRefs, scrollContainerRef } = useActiveCategory();

  return (
    <Container.Full className="pt-0">
      <div className="flex items-center gap-2 pt-4">
        <H2 className="text-2xl">
          {`${welcomeText.schemaVersion()} ${getSystemInfo().schema_version}`}
        </H2>
        <span className="-ml-2 flex-1" />
        <Link.Green
          className="print:hidden"
          download
          href="/context/datamodel.json"
        >
          {schemaText.downloadAsJson()}
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
          {schemaText.downloadAsTsv()}
        </Button.Green>
      </div>
      <div className="relative flex flex-1 gap-6 overflow-hidden md:flex-row">
        <DataModelAside activeCategory={visibleChild} />
        <div
          className="ml-2 flex flex-col gap-2 overflow-y-auto"
          ref={scrollContainerRef}
        >
          <Table
            data={tables}
            getLink={({ name }): string =>
              `#${(name as readonly [string, JSX.Element])[0]}`
            }
            headers={tableColumns()}
            sortName="dataModelTables"
          />
          {tables.map(({ name }, index) => (
            <DataModelTable
              tableName={(name as readonly [keyof Tables, JSX.Element])[0]}
              key={index}
              forwardRef={forwardRefs?.bind(undefined, index)}
            />
          ))}
        </div>
      </div>
    </Container.Full>
  );
}

export function DataModelAside({
  activeCategory,
}: {
  readonly activeCategory: number | undefined;
}): JSX.Element {
  const tables = React.useMemo(getTables, []);
  const [freezeCategory, setFreezeCategory] = useFrozenCategory();
  const currentIndex = freezeCategory ?? activeCategory;
  const navigate = useNavigate();
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const isInOverlay = typeof state === 'object';

  React.useEffect(
    () =>
      isInOverlay || activeCategory === undefined
        ? undefined
        : navigate(
            `/specify/data-model/#${
              (tables[activeCategory].name as readonly [string, JSX.Element])[0]
            }`,
            {
              replace: true,
            }
          ),
    [isInOverlay, tables, activeCategory]
  );

  return (
    <aside
      className={`
        left-0 hidden min-w-fit flex-1 flex-col divide-y-4
        divide-[color:var(--form-background)] overflow-y-auto md:flex
      `}
    >
      {tables.map(({ name }, index) => {
        const [tableName, jsxName] = name as readonly [string, JSX.Element];
        return (
          <Link.Gray
            aria-current={currentIndex === index ? 'page' : undefined}
            href={`#${tableName}`}
            key={index}
            onClick={(): void => setFreezeCategory(index)}
            className="!justify-start"
          >
            {jsxName}
          </Link.Gray>
        );
      })}
    </aside>
  );
}

const dataModelToTsv = (): string =>
  [
    [
      schemaText.table(),
      schemaText.fieldLabel(),
      getField(schema.models.SpLocaleContainer, 'isSystem').label,
      getField(schema.models.SpLocaleContainer, 'isHidden').label,
      schemaText.tableId(),
      getField(schema.models.SpLocaleContainerItem, 'name').label,
      schemaText.fieldLabel(),
      schemaText.description(),
      getField(schema.models.SpLocaleContainerItem, 'isHidden').label,
      schemaText.readOnly(),
      getField(schema.models.SpLocaleContainerItem, 'isRequired').label,
      formsText.relationship(),
      getField(schema.models.SpLocaleContainerItem, 'type').label,
      schemaText.fieldLength(),
      schemaText.databaseColumn(),
      schemaText.relatedModel(),
      schemaText.otherSideName(),
      schemaText.dependent(),
    ],
    ...Object.values(schema.models).flatMap((model) => {
      const commonColumns = [
        model.name,
        model.label,
        booleanFormatter(model.isSystem),
        booleanFormatter(model.isHidden),
        model.tableId,
      ];
      return [
        model.literalFields.map((field) => [
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
        model.relationships.map((relationship) => [
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
      ];
    }),
  ]
    .map((line) => line.join('\t'))
    .join('\n');

export function DataModelRedirect(): null {
  const { tableName = '' } = useParams();
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(`/specify/data-model/#${tableName}`, { replace: true });
  }, []);
  return null;
}
