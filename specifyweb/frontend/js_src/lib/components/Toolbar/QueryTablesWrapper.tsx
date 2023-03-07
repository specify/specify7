import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { GetSet, RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getModelById, strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpQuery, Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission, hasToolPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { QueryImport } from '../QueryBuilder/Import';
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
  'Project',
  'ReferenceWork',
  'RepositoryAgreement',
  'Shipment',
  'SpAuditLog',
  'Storage',
  'Taxon',
  'TreatmentEvent',
];

export function useQueryModels(): GetSet<RA<SpecifyModel>> {
  const [tables, setTables] = userPreferences.use(
    'queryBuilder',
    'general',
    'shownTables'
  );
  const visibleTables =
    tables.length === 0
      ? defaultQueryTablesConfig.map(strictGetModel)
      : tables.map(getModelById);
  const accessibleTables = visibleTables.filter(({ name }) =>
    hasTablePermission(name, 'read')
  );
  const handleChange = React.useCallback(
    (models: RA<SpecifyModel>) =>
      setTables(models.map((model) => model.tableId)),
    [setTables]
  );
  return [accessibleTables, handleChange];
}

export function QueryTables({
  tables,
  onClick: handleClick,
}: {
  readonly tables: RA<SpecifyModel>;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
}) {
  return (
    <Ul className="flex flex-col gap-1">
      {tables.map(({ name, label }, index) => (
        <li className="contents" key={index}>
          <QueryTableItem label={label} name={name} onClick={handleClick} />
        </li>
      ))}
    </Ul>
  );
}

export function QueryTablesWrapper({
  isReadOnly,
  queries,
  onClose: handleClose,
  onClick: handleClick,
}: {
  readonly isReadOnly: boolean;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly onClose: () => void;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
}): JSX.Element {
  const [tables] = useQueryModels();

  const [isEditing, handleEditing] = useBooleanState();
  const [isImporting, handleImporting] = useBooleanState();
  const isEmbedded = handleClick !== undefined;
  return isImporting ? (
    <QueryImport queries={queries} onClose={handleClose} />
  ) : isEditing ? (
    <QueryTablesEdit onClose={handleClose} />
  ) : (
    <Dialog
      buttons={
        <>
          {!isReadOnly &&
          !isEmbedded &&
          hasToolPermission('queryBuilder', 'create') ? (
            <Button.Green onClick={handleImporting}>
              {commonText.import()}
            </Button.Green>
          ) : undefined}
          <span className="-ml-2 flex-1" />
          <Button.Gray onClick={handleClose}>{commonText.close()}</Button.Gray>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={queryText.newQueryName()}
      headerButtons={
        isEmbedded ? undefined : <DataEntry.Edit onClick={handleEditing} />
      }
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
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
  onClick: handleClick,
}: {
  readonly name: keyof Tables;
  readonly label: string;
  readonly onClick: ((tableName: keyof Tables) => void) | undefined;
}) {
  return handleClick === undefined ? (
    <Link.Default href={`/specify/query/new/${name.toLowerCase()}/`}>
      <TableIcon label={false} name={name} />
      {label}
    </Link.Default>
  ) : (
    <Button.LikeLink onClick={() => handleClick(name)}>
      <TableIcon label={false} name={name} />
      {label}
    </Button.LikeLink>
  );
}
