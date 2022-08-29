import React from 'react';

import { ajax } from '../../utils/ajax';
import { formData, Http } from '../../utils/ajax/helpers';
import { error } from '../Errors/assert';
import type { SpQuery, SpReport } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { hasPermission } from '../Permissions/helpers';
import { schema } from '../DataModel/schema';
import { LoadingContext } from '../Core/Contexts';
import { downloadFile } from '../Molecules/FilePicker';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { deserializeResource } from '../../hooks/resource';
import { ResourceView } from '../Forms/ResourceView';
import { useNavigate } from 'react-router-dom';
import { DataEntry } from '../Atoms/DataEntry';
import { Button } from '../Atoms/Button';
import { Form, Input } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { useId } from '../../hooks/useId';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import {SerializedResource} from '../DataModel/helperTypes';
import {AutoGrowTextArea} from '../Molecules/AutoGrowTextArea';

export function QueryEditButton({
  query,
}: {
  readonly query: SerializedResource<SpQuery>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const queryResource = React.useMemo(
    () => deserializeResource(query),
    [query]
  );
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <EditQueryDialog queryResource={queryResource} onClose={handleClose} />
      )}
    </>
  );
}

function EditQueryDialog({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    'default' | 'dwcaExport' | 'labelExport' | 'report' | 'reportExport'
  >('default');

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  return state === 'default' ? (
    <ResourceView
      canAddAnother={false}
      dialog="modal"
      extraButtons={
        <>
          <span className="-ml-2 flex-1" />
          <Button.Green
            onClick={(): void => {
              loading(
                downloadFile(
                  `${queryResource.get('name')}.json`,
                  JSON.stringify(queryResource.toJSON(), null, '\t')
                )
              );
            }}
          >
            {commonText('export')}
          </Button.Green>
        </>
      }
      isDependent={false}
      isSubForm={false}
      mode="edit"
      resource={queryResource}
      onClose={handleClose}
      onDeleted={handleClose}
      onSaved={(): void => navigate(`/specify/query/${queryResource.id}/`)}
    >
      {queryResource.isNew() ? undefined : (
        <div className="flex flex-col">
          <p>{commonText('actions')}</p>
          <Button.LikeLink onClick={(): void => setState('dwcaExport')}>
            {commonText('exportQueryForDwca')}
          </Button.LikeLink>
          {hasPermission('/report', 'execute') && (
            <>
              <Button.LikeLink onClick={(): void => setState('reportExport')}>
                {commonText('exportQueryAsReport')}
              </Button.LikeLink>
              <Button.LikeLink onClick={(): void => setState('labelExport')}>
                {commonText('exportQueryAsLabel')}
              </Button.LikeLink>
            </>
          )}
        </div>
      )}
    </ResourceView>
  ) : state === 'dwcaExport' ? (
    <DwcaQueryExport queryResource={queryResource} onClose={handleClose} />
  ) : state === 'reportExport' || state === 'labelExport' ? (
    <QueryExport
      asLabel={state === 'labelExport'}
      queryResource={queryResource}
      onClose={handleClose}
    />
  ) : (
    error('Invalid state')
  );
}

function DwcaQueryExport({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [exported] = useAsyncState<string>(
    React.useCallback(
      async () =>
        ajax(`/export/extract_query/${queryResource.id}/`, {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'text/plain' },
        }).then(({ data: xml }) => xml),
      [queryResource.id]
    ),
    true
  );

  return typeof exported === 'string' ? (
    <Dialog
      buttons={commonText('close')}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={commonText('exportQueryForDwcaDialogHeader')}
      onClose={handleClose}
    >
      <AutoGrowTextArea isReadOnly value={exported} />
    </Dialog>
  ) : null;
}

function QueryExport({
  queryResource,
  onClose: handleClose,
  asLabel,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly asLabel: boolean;
}): JSX.Element {
  const id = useId('query-export');
  const [name, setName] = React.useState<string>('');
  const loading = React.useContext(LoadingContext);

  const navigate = useNavigate();
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('create')}</Submit.Blue>
        </>
      }
      header={
        asLabel
          ? commonText('createLabelDialogHeader')
          : commonText('createReportDialogHeader')
      }
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ajax<SerializedResource<SpReport>>(
              '/report_runner/create/',
              {
                method: 'POST',
                body: formData({
                  queryid: queryResource.id,
                  mimetype: asLabel ? 'jrxml/label' : 'jrxml/report',
                  name: name.trim(),
                }),
                headers: {
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  Accept: 'application/json',
                },
              },
              { expectedResponseCodes: [Http.CREATED] }
            )
              .then(async ({ data: reportJson }) => {
                const report = new schema.models.SpReport.Resource(reportJson);
                return report.rgetPromise('appResource');
              })
              .then((appResource) =>
                navigate(`/specify/appresources/${appResource.id}/`)
              )
          )
        }
      >
        <Input.Text
          maxLength={getMaxLength()}
          placeholder={
            asLabel ? commonText('labelName') : commonText('reportName')
          }
          required
          value={name}
          onValueChange={(value): void => setName(value)}
        />
      </Form>
    </Dialog>
  );
}

const getMaxLength = (): number | undefined =>
  f.min(
    schema.models.SpAppResource.getLiteralField('name')!.length,
    schema.models.SpReport.getLiteralField('name')!.length
  );
