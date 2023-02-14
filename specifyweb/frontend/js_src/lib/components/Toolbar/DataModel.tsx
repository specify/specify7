/**
 * Data Model viewer
 */

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { schemaText } from '../../localization/schema';
import { welcomeText } from '../../localization/welcome';
import type { SortConfigs } from '../../utils/cache/definitions';
import { syncFieldFormat } from '../../utils/fieldFormat';
import { f } from '../../utils/functools';
import { resolveParser } from '../../utils/parser/definitions';
import type { IR, RA, RR } from '../../utils/types';
import { ensure } from '../../utils/types';
import { Container, H2, H3 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { Link } from '../Atoms/Link';
import { getField } from '../DataModel/helpers';
import { getModel, schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { getSystemInfo } from '../InitialContext/systemInfo';
import { downloadFile } from '../Molecules/FilePicker';
import { SortIndicator, useSortConfig } from '../Molecules/Sorting';
import { TableIcon } from '../Molecules/TableIcon';
import { NotFoundView } from '../Router/NotFoundView';
import { locationToState } from '../Router/RouterState';
import {
  javaTypeToHuman,
  localizedRelationshipTypes,
} from '../SchemaConfig/helpers';
import { useFrozenCategory } from '../UserPreferences/Aside';
import { useTopChild } from '../UserPreferences/useTopChild';

function Table<
  SORT_CONFIG extends
    | 'dataModelFields'
    | 'dataModelRelationships'
    | 'dataModelTables',
  FIELD_NAME extends SortConfigs[SORT_CONFIG],
  DATA extends Row<RR<FIELD_NAME, Value>>
>({
  sortName,
  headers,
  data: unsortedData,
  getLink,
  className = '',
}: {
  readonly sortName: SORT_CONFIG;
  readonly headers: RR<FIELD_NAME, LocalizedString>;
  readonly data: RA<DATA>;
  readonly getLink: ((row: DATA) => string) | undefined;
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
        ${className}
      `}
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

const topId = 'tables';

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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <TableIcon label={false} name={model.name} />
          <H2 className="text-2xl" id={model.name.toLowerCase()}>
            {model.name}
          </H2>
        </div>
        <Link.Default href={`#${topId}`}>{schemaText.goToTop()}</Link.Default>
      </div>
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
type Row<SHAPE extends IR<Value>> = SHAPE;
const getFields = (model: SpecifyModel) =>
  ensure<RA<Row<RR<keyof ReturnType<typeof fieldColumns>, Value>>>>()(
    model.literalFields.map(
      (field) =>
        ({
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
        } as const)
    )
  );

function DataModelFields({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getFields(model), [model]);
  const scope = model.getScopingRelationship()?.relatedModel.name;

  return (
    <>
      <p>
        {commonText.colonLine({
          label: schemaText.idField(),
          value: model.idField.name,
        })}
      </p>
      {typeof scope === 'string' && (
        <p>
          {commonText.colonLine({
            label: schemaText.scope(),
            value: scope,
          })}
        </p>
      )}
      <H3>{schemaText.fields()}</H3>
      <Table
        data={data}
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

const getRelationships = (model: SpecifyModel) =>
  ensure<RA<Row<RR<keyof ReturnType<typeof relationshipColumns>, Value>>>>()(
    model.relationships.map(
      (field) =>
        ({
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
        } as const)
    )
  );

function DataModelRelationships({
  model,
}: {
  readonly model: SpecifyModel;
}): JSX.Element {
  const data = React.useMemo(() => getRelationships(model), [model]);

  const [dependentFilter, setDependentFilter] = React.useState<
    boolean | undefined
  >(undefined);

  const filteredDependentData = React.useMemo(
    () =>
      typeof dependentFilter === 'boolean'
        ? data.filter(
            (relationship) =>
              model.strictGetRelationship(relationship.name).isDependent() ===
              dependentFilter
          )
        : data,
    [dependentFilter]
  );

  return (
    <>
      <div className="flex items-center gap-4">
        <H3 id={model.name.toLowerCase()}>{schemaText.relationships()}</H3>
        <div className="flex items-center gap-2">
          <Button.Small
            aria-pressed={
              dependentFilter === true || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? true
                  : dependentFilter
                  ? undefined
                  : true
              )
            }
          >
            {schemaText.dependent()}
          </Button.Small>
          <Button.Small
            aria-pressed={
              dependentFilter === false || dependentFilter === undefined
            }
            onClick={(): void =>
              setDependentFilter(
                dependentFilter === undefined
                  ? false
                  : dependentFilter
                  ? false
                  : undefined
              )
            }
          >
            {schemaText.independent()}
          </Button.Small>
        </div>
      </div>
      <Table
        data={filteredDependentData}
        getLink={({ relatedModel }): string => `#${relatedModel[0]}`}
        headers={relationshipColumns()}
        sortName="dataModelRelationships"
      />
    </>
  );
}

const tableColumns = f.store(
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
const getTables = () =>
  ensure<RA<Row<RR<keyof ReturnType<typeof tableColumns>, Value>>>>()(
    Object.values(schema.models).map(
      (model) =>
        ({
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
        } as const)
    )
  );

export function DataModelTables(): JSX.Element {
  const tables = React.useMemo(getTables, []);
  const { visibleChild, forwardRefs, scrollContainerRef } = useTopChild();

  return (
    <Container.Full className="pt-0">
      <div className="flex flex-wrap items-center gap-2 pt-4">
        <H2 className="text-2xl">
          {`${welcomeText.schemaVersion()} ${getSystemInfo().schema_version}`}
        </H2>
        <span className="-ml-2 flex-1" />
        <Link.Blue
          className="print:hidden"
          download
          href="/context/datamodel.json"
        >
          {schemaText.downloadAsJson()}
        </Link.Blue>
        <Button.Blue
          className="print:hidden"
          onClick={(): void =>
            void downloadFile(
              `Specify 7 Data Model - v${getSystemInfo().schema_version}.tsv`,
              dataModelToTsv()
            ).catch(softFail)
          }
        >
          {schemaText.downloadAsTsv()}
        </Button.Blue>
      </div>
      <div className="relative flex flex-1 gap-6 overflow-hidden md:flex-row">
        <DataModelAside activeCategory={visibleChild} />
        <div
          className="ml-2 flex flex-col gap-2 overflow-y-auto"
          ref={scrollContainerRef}
        >
          <div id={topId}>
            <Table
              data={tables}
              getLink={({ name }): string => `#${name[0]}`}
              headers={tableColumns()}
              sortName="dataModelTables"
            />
          </div>
          {tables.map(({ name }, index) => (
            <DataModelTable
              forwardRef={forwardRefs?.bind(undefined, index)}
              key={index}
              tableName={name[0] as keyof Tables}
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
        : navigate(`/specify/data-model/#${tables[activeCategory].name[0]}`, {
            replace: true,
          }),
    [isInOverlay, tables, activeCategory]
  );

  return (
    <aside
      className={`
        left-0 hidden min-w-fit flex-1 flex-col divide-y-4
        divide-[color:var(--form-background)] overflow-y-auto md:flex
      `}
    >
      {tables.map(({ name: [tableName, jsxName] }, index) => (
        <Link.Gray
          aria-current={currentIndex === index ? 'page' : undefined}
          className="!justify-start"
          href={`#${tableName}`}
          key={index}
          onClick={(): void => setFreezeCategory(index)}
        >
          {jsxName}
        </Link.Gray>
      ))}
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
        model.label.replace('\n', ' '),
        booleanFormatter(model.isSystem),
        booleanFormatter(model.isHidden),
        model.tableId,
      ];
      return [
        ...model.literalFields.map((field) => [
          ...commonColumns,
          field.name,
          field.label.replace('\n', ' '),
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
          relationship.label.replace('\n', ' '),
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
