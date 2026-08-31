import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { StringToJsx } from '../../localization/utils';
import type { GetSet, IR, RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryImport } from '../QueryBuilder/Import';
import { tablesFilter } from '../SchemaConfig/Tables';
import { QueryTablesEdit } from './QueryTablesEdit';

export const defaultQueryTablesConfig: RA<keyof Tables> = [
  'Accession',
  'AddressOfRecord',
  'Agent',
  'Appraisal',
  'Attachment',
  'Author',
  'Borrow',
  'CollectingEvent',
  'CollectingTrip',
  'CollectionObject',
  'CollectionRelationship',
  'ConservDescription',
  'Container',
  'DNASequence',
  'Deaccession',
  'Determination',
  'Disposal',
  'DisposalPreparation',
  'ExchangeIn',
  'ExchangeOut',
  'Exsiccata',
  'ExsiccataItem',
  'FieldNotebook',
  'FieldNotebookPage',
  'FieldNotebookPageSet',
  'Geography',
  'GeologicTimePeriod',
  'Gift',
  'GiftPreparation',
  'GroupPerson',
  'InfoRequest',
  'Journal',
  'LithoStrat',
  'Loan',
  'LoanPreparation',
  'LoanReturnPreparation',
  'Locality',
  'MaterialSample',
  'PaleoContext',
  'Permit',
  'Preparation',
  'PrepType',
  'Project',
  'ReferenceWork',
  'RepositoryAgreement',
  'Shipment',
  'SpAuditLog',
  'Storage',
  'Taxon',
  'TectonicUnit',
  'TreatmentEvent',
];

export function useQueryTables(): GetSet<RA<SpecifyTable>> {
  const [tables, setTables] = userPreferences.use(
    'queryBuilder',
    'general',
    'shownTables'
  );
  const [isNoRestrictionMode] = userPreferences.use(
    'queryBuilder',
    'general',
    'noRestrictionsMode'
  );

  const visibleTables =
    tables.length === 0
      ? defaultQueryTablesConfig.map(strictGetTable)
      : tables.map(getTableById);

  const allowedTables = visibleTables.filter((table) =>
    tablesFilter(isNoRestrictionMode, false, true, table)
  );

  const handleChange = React.useCallback(
    (models: RA<SpecifyTable>) =>
      setTables(models.map((model) => model.tableId)),
    [setTables]
  );
  return [allowedTables, handleChange];
}

export function QueryTables({
  tables,
  onClick: handleClick,
  counts,
  getHref = (tableName): string =>
    `/specify/query/new/${tableName.toLowerCase()}/`,
  renderAction,
  isDisabled,
  disabledTitle,
}: {
  readonly tables: RA<SpecifyTable>;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
  readonly counts?: IR<number | undefined>;
  readonly getHref?: (tableName: keyof Tables) => string;
  readonly renderAction?: (table: SpecifyTable) => JSX.Element | undefined;
  readonly isDisabled?: (table: SpecifyTable) => boolean;
  readonly disabledTitle?: LocalizedString;
}): JSX.Element {
  return (
    <Ul className="flex flex-col gap-1">
      {tables.map((table, index) => {
        const { name, label } = table;
        return (
          <li
            className={
              renderAction === undefined
                ? 'contents'
                : 'flex items-center gap-1'
            }
            key={index}
          >
            <QueryTableItem
              count={counts?.[name]}
              disabled={isDisabled?.(table) ?? false}
              disabledTitle={disabledTitle}
              getHref={getHref}
              isCountLoading={counts !== undefined && !(name in counts)}
              label={label}
              name={name}
              onClick={handleClick}
            />
            <span className="-ml-2 flex-1" />
            {renderAction?.(table)}
          </li>
        );
      })}
    </Ul>
  );
}

export function QueryTablesWrapper({
  onClose: handleClose,
  onClick: handleClick,
}: {
  readonly onClose: () => void;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
}): JSX.Element {
  const [tables] = useQueryTables();

  const [isEditing, handleEditing] = useBooleanState();
  const [isImporting, handleImporting] = useBooleanState();
  const isEmbedded = handleClick !== undefined;
  const isReadOnly = React.useContext(ReadOnlyContext);
  return isImporting ? (
    <QueryImport onClose={handleClose} />
  ) : isEditing ? (
    <QueryTablesEdit onClose={handleClose} />
  ) : (
    <Dialog
      buttons={
        <>
          {!isReadOnly &&
          !isEmbedded &&
          hasToolPermission('queryBuilder', 'create') ? (
            <Button.Success onClick={handleImporting}>
              {commonText.import()}
            </Button.Success>
          ) : undefined}
          <span className="-ml-2 flex-1" />
          <Button.Secondary onClick={handleClose}>
            {commonText.close()}
          </Button.Secondary>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={queryText.newQueryName()}
      headerButtons={
        isEmbedded ? undefined : <DataEntry.Edit onClick={handleEditing} />
      }
      icon={icons.documentSearch}
      onClose={handleClose}
    >
      <Ul className="flex flex-col gap-1">
        <QueryTables tables={tables} onClick={handleClick} />
      </Ul>
    </Dialog>
  );
}

function QueryTableItem({
  name,
  label,
  count,
  isCountLoading,
  onClick: handleClick,
  getHref,
  disabled,
  disabledTitle,
}: {
  readonly name: keyof Tables;
  readonly label: LocalizedString;
  readonly count: number | undefined;
  readonly isCountLoading: boolean;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
  readonly getHref: (tableName: keyof Tables) => string;
  readonly disabled: boolean;
  readonly disabledTitle?: LocalizedString;
}): JSX.Element {
  const content = (
    <>
      <TableIcon label={false} name={name} />
      {typeof count === 'number' ? (
        <StringToJsx
          components={{
            // eslint-disable-next-line react/no-unstable-nested-components
            wrap: (formattedCount) => (
              <span className="text-neutral-500">{formattedCount}</span>
            ),
          }}
          string={commonText.jsxCountLine({ resource: label, count })}
        />
      ) : isCountLoading ? (
        <>
          {label}
          <span
            aria-hidden
            className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-500 border-r-transparent"
          />
        </>
      ) : (
        label
      )}
    </>
  );
  return disabled ? (
    <span
      className="flex items-center gap-2 text-gray-400 dark:text-neutral-600"
      title={disabledTitle}
    >
      {content}
    </span>
  ) : handleClick === undefined ? (
    <Link.Default href={getHref(name)}>{content}</Link.Default>
  ) : (
    <Button.LikeLink onClick={(): void => handleClick(name)}>
      {content}
    </Button.LikeLink>
  );
}
