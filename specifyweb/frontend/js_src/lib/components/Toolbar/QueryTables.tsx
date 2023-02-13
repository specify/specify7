import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { queryText } from '../../localization/query';
import { commonText } from '../../localization/common';
import type { GetSet, RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTableById, strictGetTable } from '../DataModel/tables';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { SpQuery, Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { hasTablePermission, hasToolPermission } from '../Permissions/helpers';
import { QueryImport } from '../QueryBuilder/Import';
import { usePref } from '../UserPreferences/usePref';
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

export function useQueryTables(): GetSet<RA<SpecifyTable>> {
  const [tables, setTables] = usePref('queryBuilder', 'general', 'shownTables');
  const visibleTables =
    tables.length === 0
      ? defaultQueryTablesConfig.map(strictGetTable)
      : tables.map(getTableById);
  const accessibleTables = visibleTables.filter(({ name }) =>
    hasTablePermission(name, 'read')
  );
  const handleChange = React.useCallback(
    (tables: RA<SpecifyTable>) =>
      setTables(tables.map(({ tableId }) => tableId)),
    [setTables]
  );
  return [accessibleTables, handleChange];
}

export function QueryTables({
  isReadOnly,
  queries,
  onClose: handleClose,
}: {
  readonly isReadOnly: boolean;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [tables] = useQueryTables();

  const [isEditing, handleEditing] = useBooleanState();
  const [isImporting, handleImporting] = useBooleanState();
  return isImporting ? (
    <QueryImport queries={queries} onClose={handleClose} />
  ) : isEditing ? (
    <QueryTablesEdit onClose={handleClose} />
  ) : (
    <Dialog
      buttons={
        <>
          {!isReadOnly && hasToolPermission('queryBuilder', 'create') ? (
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
      headerButtons={<DataEntry.Edit onClick={handleEditing} />}
      icon={<span className="text-blue-500">{icons.documentSearch}</span>}
      onClose={handleClose}
    >
      <Ul className="flex flex-col gap-1">
        {tables.map(({ name, label }, index) => (
          <li className="contents" key={index}>
            <Link.Default href={`/specify/query/new/${name.toLowerCase()}/`}>
              <TableIcon label={false} name={name} />
              {label}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}
