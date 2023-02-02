import React from 'react';

import type { SpQuery, Tables } from '../DataModel/types';
import { commonText } from '../../localization/common';
import { hasTablePermission, hasToolPermission } from '../Permissions/helpers';
import { getModelById, strictGetModel } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { GetSet, RA } from '../../utils/types';
import { icons } from '../Atoms/Icons';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryImport } from '../QueryBuilder/Import';
import { QueryTablesEdit } from './QueryTablesEdit';
import { Button } from '../Atoms/Button';
import { Ul } from '../Atoms';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import { useBooleanState } from '../../hooks/useBooleanState';
import { SerializedResource } from '../DataModel/helperTypes';
import { TableIcon } from '../Molecules/TableIcon';
import { queryText } from '../../localization/query';
import { userPreferences } from '../Preferences/userPreferences';

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
  isReadOnly,
  queries,
  onClose: handleClose,
}: {
  readonly isReadOnly: boolean;
  readonly queries: RA<SerializedResource<SpQuery>> | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [tables] = useQueryModels();

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
          <li key={index} className="contents">
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
