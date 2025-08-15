import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { smoothScroll } from '../../utils/dom';
import type { RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceEvents } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { RecordSet, SpQuery, SpQueryField } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { TableIcon } from '../Molecules/TableIcon';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
} from '../Permissions/helpers';
import { SaveQueryButtons, ToggleMappingViewButton } from './Components';
import { useQueryViewPref } from './Context';
import { QueryEditButton } from './Edit';
import { QueryLoanReturn } from './LoanReturn';
import type { MainState } from './reducer';

export type QueryView = {
  readonly basicView: RA<number>;
  readonly detailedView: RA<number>;
};

export function QueryHeader({
  recordSet,
  query,
  queryResource,
  isScrolledTop,
  form,
  state,
  isEmbedded,
  getQueryFieldRecords,
  saveRequired,
  unsetUnloadProtect,
  onTriedToSave: handleTriedToSave,
  onSaved: handleSaved,
}: {
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly query: SerializedResource<SpQuery>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly isScrolledTop: boolean;
  readonly form: HTMLFormElement | null;
  readonly state: MainState;
  readonly isEmbedded: boolean;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly saveRequired: boolean;
  readonly unsetUnloadProtect: () => void;
  readonly onTriedToSave: () => void;
  readonly onSaved: () => void;
}): JSX.Element {
  // Detects any query being deleted and updates it every where and redirect
  const navigate = useNavigate();
  React.useEffect(
    () =>
      resourceEvents.on('deleted', (resource) => {
        if (
          resource.specifyTable.name === 'SpQuery' &&
          resource.id === query.id
        )
          navigate('/specify/', { replace: true });
      }),
    [query]
  );

  const [isBasic, setIsBasic] = useQueryViewPref(query.id);

  return (
    <header
      className={`
        flex flex-col items-center justify-between gap-2
        overflow-x-auto whitespace-nowrap sm:flex-row 
        sm:overflow-x-visible`}
    >
      <div className="flex items-center justify-center gap-2">
        <TableIcon label name={state.baseTableName} />
        <H2 className="overflow-x-auto">
          {typeof recordSet === 'object'
            ? queryText.queryRecordSetTitle({
                queryName: query.name,
                recordSetTable: tables.RecordSet.label,
                recordSetName: recordSet.get('name'),
              })
            : commonText.colonLine({
                label: queryText.query(),
                value: query.name,
              })}
        </H2>
        {!queryResource.isNew() && <QueryEditButton query={query} />}
        {!isScrolledTop && (
          <Button.Icon
            icon="arrowCircleUp"
            title={queryText.scrollToEditor()}
            onClick={(): void =>
              form === null ? undefined : smoothScroll(form, 0)
            }
          />
        )}
      </div>
      {state.baseTableName === 'LoanPreparation' &&
      hasPermission('/querybuilder/query', 'execute') &&
      hasTablePermission('Loan', 'update') &&
      hasTablePermission('LoanReturnPreparation', 'create') &&
      hasTablePermission('LoanPreparation', 'read') ? (
        <ErrorBoundary dismissible>
          <QueryLoanReturn
            fields={state.fields}
            getQueryFieldRecords={getQueryFieldRecords}
            queryResource={queryResource}
          />
        </ErrorBoundary>
      ) : undefined}
      <div className="flex flex-wrap justify-center gap-2">
        <Button.Small onClick={() => setIsBasic(!isBasic)}>
          {isBasic
            ? preferencesText.detailedView()
            : preferencesText.basicView()}
        </Button.Small>
        <ToggleMappingViewButton fields={state.fields} />
        {hasToolPermission(
          'queryBuilder',
          queryResource.isNew() ? 'create' : 'update'
        ) && !isEmbedded ? (
          <SaveQueryButtons
            fields={state.fields}
            getQueryFieldRecords={getQueryFieldRecords}
            isValid={(): boolean => form?.reportValidity() ?? false}
            queryResource={queryResource}
            saveRequired={saveRequired}
            unsetUnloadProtect={unsetUnloadProtect}
            onSaved={handleSaved}
            onTriedToSave={(): boolean => {
              handleTriedToSave();
              const fieldLengthLimit =
                getField(tables.SpQueryField, 'startValue').length ??
                Number.POSITIVE_INFINITY;
              return state.fields.every((field) =>
                field.filters.every(
                  ({ startValue }) => startValue.length < fieldLengthLimit
                )
              );
            }}
          />
        ) : null}
      </div>
    </header>
  );
}
