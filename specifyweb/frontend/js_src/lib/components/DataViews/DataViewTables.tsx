import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { dataViewsText } from '../../localization/dataViews';
import { schemaText } from '../../localization/schema';
import { GetSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { icons } from '../Atoms/Icons';
import { SpecifyTable } from '../DataModel/specifyTable';
import { getTableById, strictGetTable } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { userPreferences } from '../Preferences/userPreferences';
import { OverlayContext } from '../Router/Router';
import { tablesFilter } from '../SchemaConfig/Tables';
import { TablesListEdit } from '../Toolbar/QueryTablesEdit';
import { QueryTables } from '../Toolbar/QueryTablesWrapper';

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
      <QueryTables
        getHref={(name) => `/specify/dataviews/${name.toLowerCase()}`}
        tables={tables}
        onClick={undefined}
      />
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
