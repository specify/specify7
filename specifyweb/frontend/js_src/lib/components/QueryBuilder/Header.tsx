import React from 'react';

import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { RecordSet, SpQuery, SpQueryField } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { TableIcon } from '../Molecules/TableIcon';
import { hasToolPermission } from '../Permissions/helpers';
import {
  ProtectedAction,
  ProtectedTable,
} from '../Permissions/PermissionDenied';
import { SaveQueryButtons } from './Components';
import { QueryEditButton } from './Edit';
import { smoothScroll } from './helpers';
import { QueryLoanReturn } from './LoanReturn';
import type { MainState } from './reducer';

export function QueryHeader({
  recordSet,
  query,
  queryResource,
  isScrolledTop,
  container,
  state,
  getQueryFieldRecords,
  isReadOnly,
  formRef,
  saveRequired,
  unsetUnloadProtect,
  onTriedToSave: handleTriedToSave,
  onSaved: handleSaved,
}: {
  readonly recordSet?: SpecifyResource<RecordSet>;
  readonly query: SerializedResource<SpQuery>;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly isScrolledTop: boolean;
  readonly container: HTMLDivElement | null;
  readonly state: MainState;
  readonly getQueryFieldRecords:
    | (() => RA<SerializedResource<SpQueryField>>)
    | undefined;
  readonly isReadOnly: boolean;
  readonly formRef: React.MutableRefObject<HTMLFormElement | null>;
  readonly saveRequired: boolean;
  readonly unsetUnloadProtect: () => void;
  readonly onTriedToSave: () => void;
  readonly onSaved: () => void;
}): JSX.Element {
  return (
    <header className="flex items-center gap-2 whitespace-nowrap">
      <TableIcon label name={state.baseTableName} />
      <H2 className="overflow-x-auto">
        {typeof recordSet === 'object'
          ? queryText('queryRecordSetTitle', query.name, recordSet.get('name'))
          : queryText('queryTaskTitle', query.name)}
      </H2>
      {!queryResource.isNew() && <QueryEditButton query={query} />}
      <span className="ml-2 flex-1" />
      {!isScrolledTop && (
        <Button.Small
          onClick={(): void =>
            container === null ? undefined : smoothScroll(container, 0)
          }
        >
          {queryText('editQuery')}
        </Button.Small>
      )}
      {state.baseTableName === 'LoanPreparation' && (
        <ProtectedAction action="execute" resource="/querybuilder/query">
          <ProtectedTable action="update" tableName="Loan">
            <ProtectedTable action="create" tableName="LoanReturnPreparation">
              <ProtectedTable action="read" tableName="LoanPreparation">
                <ErrorBoundary dismissable>
                  <QueryLoanReturn
                    fields={state.fields}
                    getQueryFieldRecords={getQueryFieldRecords}
                    queryResource={queryResource}
                  />
                </ErrorBoundary>
              </ProtectedTable>
            </ProtectedTable>
          </ProtectedTable>
        </ProtectedAction>
      )}
      {hasToolPermission(
        'queryBuilder',
        queryResource.isNew() ? 'create' : 'update'
      ) && (
        <SaveQueryButtons
          fields={state.fields}
          getQueryFieldRecords={getQueryFieldRecords}
          isReadOnly={isReadOnly}
          isValid={(): boolean => formRef.current?.reportValidity() ?? false}
          queryResource={queryResource}
          saveRequired={saveRequired}
          unsetUnloadProtect={unsetUnloadProtect}
          onSaved={handleSaved}
          onTriedToSave={(): boolean => {
            handleTriedToSave();
            const fieldLengthLimit =
              schema.models.SpQueryField.strictGetLiteralField('startValue')
                .length ?? Number.POSITIVE_INFINITY;
            return state.fields.every((field) =>
              field.filters.every(
                ({ startValue }) => startValue.length < fieldLengthLimit
              )
            );
          }}
        />
      )}
    </header>
  );
}
