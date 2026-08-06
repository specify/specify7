import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { schemaText } from '../../localization/schema';
import { GetSet, RA } from '../../utils/types';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, strictGetTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';
import { userPreferences } from '../Preferences/userPreferences';
import { OverlayContext } from '../Router/Router';
import { tablesFilter } from '../SchemaConfig/Tables';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { dataViewsText } from '../../localization/dataViews';

const defaultDataViewTablesConfig: RA<keyof Tables> = [
  'Accession',
  'AddressOfRecord',
  'Agent',
  'Appraisal',
  'Author',
  'Borrow',
  'CollectingEvent',
  'CollectingTrip',
  'Collection',
  'CollectionObject',
  'CollectionObjectGroup',
  'ConservDescription',
  'Container',
  'DNASequence',
  'Deaccession',
  'Determination',
  'Discipline',
  'Disposal',
  'Division',
  'ExchangeIn',
  'ExchangeOut',
  'Exsiccata',
  'FieldNotebook',
  'Geography',
  'GeologicTimePeriod',
  'Gift',
  'InfoRequest',
  'Institution',
  'Journal',
  'LithoStrat',
  'Loan',
  'Locality',
  'MaterialSample',
  'PaleoContext',
  'Permit',
  'Preparation',
  'PrepType',
  'ReferenceWork',
  'RepositoryAgreement',
  'Shipment',
  'Storage',
  'Taxon',
  'TectonicUnit',
  'TreatmentEvent',
];

export function DataViewTables(): JSX.Element {
  const handleClose = React.useContext(OverlayContext);
  const [tables, setTables] = useDataViewTables();
  const [isEditing, handleEditing] = useBooleanState();
  return isEditing ? (
    <TablesListEdit
      defaultTables={defaultDataViewTablesConfig}
      header={dataViewsText.configureDataViews()}
      tables={tables}
      onChange={setTables}
      onClose={handleClose}
    />
  ) : (
    <Dialog
      header={schemaText.tables()}
      buttons={
        <>
          <span className="-ml-2 flex-1" />
          <Button.Secondary onClick={handleClose}>
            {commonText.close()}
          </Button.Secondary>
        </>
      }
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      headerButtons={<DataEntry.Edit onClick={handleEditing} />}
      icon={icons.eye}
      onClose={handleClose}
    >
      {/* REFACTOR: Generalize QueryTables component */}
      <Ul className="flex flex-col gap-1">
        {tables.map(({ name, label }, index) => (
          <li className="contents" key={index}>
            <Link.Default href={`/specify/dataviews/${name.toLowerCase()}`}>
              <TableIcon label={false} name={name} />
              {label}
            </Link.Default>
          </li>
        ))}
      </Ul>
    </Dialog>
  );
}

function useDataViewTables(): GetSet<RA<SpecifyTable>> {
  const [tables, setTables] = userPreferences.use(
    'dataViews',
    'general',
    'shownTables'
  );
  const visibleTables =
    tables.length === 0
      ? defaultDataViewTablesConfig.map(strictGetTable)
      : tables.map(getTableById);

  const allowedTables = visibleTables.filter((table) =>
    tablesFilter(true, false, true, table)
  );

  const handleChange = React.useCallback(
    (models: RA<SpecifyTable>) =>
      setTables(models.map((model) => model.tableId)),
    [setTables]
  );

  return [allowedTables, handleChange];
}
