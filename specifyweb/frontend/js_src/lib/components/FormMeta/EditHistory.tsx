import React from 'react';

import type { SpQuery } from '../DataModel/types';
import { format } from '../Forms/dataObjFormatters';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { schema } from '../DataModel/schema';
import { Button } from '../Atoms/Button';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { createQuery } from '../QueryBuilder';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { AnySchema } from '../DataModel/helperTypes';
import { formattedEntry } from '../WbPlanView/mappingHelpers';

export function EditHistory({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small
        disabled={resource.isNew()}
        title={resource.isNew() ? formsText.saveRecordFirst() : undefined}
        onClick={handleOpen}
        className="normal-case"
      >
        {formsText.historyOfEdits()}
      </Button.Small>
      {isOpen && (
        <RecordHistoryDialog resource={resource} onClose={handleClose} />
      )}
    </>
  );
}

function RecordHistoryDialog({
  resource,
  onClose: handleClose,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const query = useEditHistoryQuery(resource);
  return typeof query === 'object' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={formsText.historyOfEdits()}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        isEmbedded
        isReadOnly={false}
        query={query}
        recordSet={undefined}
        forceCollection={undefined}
      />
    </Dialog>
  ) : null;
}

function useEditHistoryQuery(
  resource: SpecifyResource<AnySchema>
): SpecifyResource<SpQuery> | undefined {
  const formatted = useFormatted(resource);

  return React.useMemo(
    () =>
      typeof formatted === 'string'
        ? createQuery(
            formsText.historyOfEditsQueryName(formatted),
            schema.models.SpAuditLog
          ).set('fields', [
            QueryFieldSpec.fromPath('SpAuditLog', ['tableNum'])
              .toSpQueryField()
              .set('isDisplay', false)
              .set('operStart', queryFieldFilters.equal.id)
              .set('startValue', resource.specifyModel.tableId.toString()),
            QueryFieldSpec.fromPath('SpAuditLog', ['recordId'])
              .toSpQueryField()
              .set('isDisplay', false)
              .set('operStart', queryFieldFilters.equal.id)
              .set('startValue', resource.id.toString()),
            QueryFieldSpec.fromPath('SpAuditLog', ['action']).toSpQueryField(),
            QueryFieldSpec.fromPath('SpAuditLog', [
              'fields',
              'fieldName',
            ]).toSpQueryField(),
            QueryFieldSpec.fromPath('SpAuditLog', [
              'fields',
              'oldValue',
            ]).toSpQueryField(),
            QueryFieldSpec.fromPath('SpAuditLog', [
              'fields',
              'newValue',
            ]).toSpQueryField(),
            QueryFieldSpec.fromPath('SpAuditLog', [
              'modifiedByAgent',
              formattedEntry,
            ]).toSpQueryField(),
            QueryFieldSpec.fromPath('SpAuditLog', ['timestampModified'])
              .toSpQueryField()
              .set('sortType', flippedSortTypes.descending),
          ])
        : undefined,
    [resource, formatted]
  );
}
function useFormatted(
  resource: SpecifyResource<AnySchema>
): string | undefined {
  const [formatted] = useAsyncState(
    React.useCallback(
      async () => format(resource, undefined, true),
      [resource]
    ),
    true
  );
  return formatted;
}
