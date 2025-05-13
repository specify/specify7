import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useFormatted } from '../../hooks/useFormatted';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { Button } from '../Atoms/Button';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { Dialog, dialogClassNames, LoadingScreen } from '../Molecules/Dialog';
import { createQuery } from '../QueryBuilder';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { QueryBuilder } from '../QueryBuilder/Wrapped';
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
        className="normal-case"
        disabled={resource.isNew()}
        title={resource.isNew() ? formsText.saveRecordFirst() : undefined}
        onClick={handleOpen}
      >
        {formsText.editHistory()}
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
      header={formsText.editHistory()}
      onClose={handleClose}
    >
      <QueryBuilder
        autoRun
        forceCollection={undefined}
        isEmbedded
        query={query}
        recordSet={undefined}
      />
    </Dialog>
  ) : (
    <LoadingScreen />
  );
}

function useEditHistoryQuery(
  resource: SpecifyResource<AnySchema>
): SpecifyResource<SpQuery> | undefined {
  const formatted = useFormatted(resource);

  return React.useMemo(
    () =>
      typeof formatted === 'string'
        ? createQuery(
            formsText.editHistoryQueryName({ formattedRecord: formatted }),
            tables.SpAuditLog
          ).set('fields', [
            QueryFieldSpec.fromPath('SpAuditLog', ['tableNum'])
              .toSpQueryField()
              .set('isDisplay', false)
              .set('operStart', queryFieldFilters.equal.id)
              .set('startValue', resource.specifyTable.tableId.toString()),
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
