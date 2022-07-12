import React from 'react';

import type { SpQuery } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { flippedSortTypes } from '../querybuilderutils';
import { QueryFieldSpec } from '../queryfieldspec';
import { schema } from '../schema';
import { Button } from './basic';
import { useAsyncState, useBooleanState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';
import { QueryBuilder } from './querybuilder';
import { queryFieldFilters } from './querybuilderfieldfilter';
import { createQuery } from './querytask';

export function RecordHistory({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
        onClick={handleOpen}
        disabled={resource.isNew()}
        title={resource.isNew() ? formsText('saveRecordFirst') : undefined}
      >
        {formsText('historyOfEdits')}
      </Button.Simple>
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
      header={formsText('historyOfEdits')}
      onClose={handleClose}
      buttons={<Button.DialogClose>{commonText('close')}</Button.DialogClose>}
      className={{
        container: dialogClassNames.wideContainer,
      }}
    >
      <QueryBuilder
        query={query}
        isReadOnly={false}
        recordSet={undefined}
        isEmbedded={true}
        autoRun={true}
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
            formsText('historyOfEditsQueryName', formatted),
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
