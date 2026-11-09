import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { Form, Input } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { SpQuery, SpReport } from '../DataModel/types';
import { error } from '../Errors/assert';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { AutoGrowTextArea } from '../Molecules/AutoGrowTextArea';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { downloadFile } from '../Molecules/FilePicker';
import { hasPermission } from '../Permissions/helpers';
import { QuerySharingActions } from './Share';

export function QueryEditButton({
  queryResource,
  onRefresh,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onRefresh: () => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const isOwner =
    idFromUrl(queryResource.get('specifyUser')) === userInformation.id;
  return (
    <>
      {isOwner ? (
        <DataEntry.Edit onClick={handleOpen} />
      ) : (
        <Button.LikeLink onClick={handleOpen}>
          {commonText.export()}
        </Button.LikeLink>
      )}
      {isOpen && (
        <EditQueryDialog
          isOwner={isOwner}
          queryResource={queryResource}
          onClose={handleClose}
          onVersionChange={onRefresh}
        />
      )}
    </>
  );
}

function EditQueryDialog({
  isOwner,
  queryResource,
  onClose: handleClose,
  onVersionChange,
}: {
  readonly isOwner: boolean;
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
  readonly onVersionChange: () => void;
}): JSX.Element {
  const [state, setState] = React.useState<
    'default' | 'dwcaExport' | 'labelExport' | 'report' | 'reportExport'
  >('default');

  const loading = React.useContext(LoadingContext);
  const exportButton = (
    <Button.Success
      onClick={(): void => {
        loading(
          downloadFile(
            `${queryResource.get('name')}.json`,
            JSON.stringify(queryResource.toJSON(), null, '\t')
          )
        );
      }}
    >
      {commonText.export()}
    </Button.Success>
  );
  const actions = queryResource.isNew() ? undefined : (
    <div className="flex flex-col">
      <p>{commonText.actions()}</p>
      {isOwner &&
        idFromUrl(queryResource.get('specifyUser')) === userInformation.id &&
        queryResource.id !== undefined && (
          <QuerySharingActions
            canShare={userInformation.isadmin}
            queryId={queryResource.id}
            onVersionChange={onVersionChange}
          />
        )}
      <Button.LikeLink onClick={(): void => setState('dwcaExport')}>
        {queryText.exportQueryForDwca()}
      </Button.LikeLink>
      {hasPermission('/report', 'execute') && (
        <>
          <Button.LikeLink onClick={(): void => setState('reportExport')}>
            {queryText.exportQueryAsReport()}
          </Button.LikeLink>
          <Button.LikeLink onClick={(): void => setState('labelExport')}>
            {queryText.exportQueryAsLabel()}
          </Button.LikeLink>
        </>
      )}
    </div>
  );
  return state === 'default' ? (
    isOwner ? (
      <ResourceView
        dialog="modal"
        extraButtons={
          <>
            <span className="-ml-2 flex-1" />
            {exportButton}
          </>
        }
        isDependent={false}
        isSubForm={false}
        resource={queryResource}
        onAdd={undefined}
        onClose={handleClose}
        onDeleted={handleClose}
        onSaved={(): void => globalThis.location.reload()}
      >
        {actions}
      </ResourceView>
    ) : (
      <Dialog
        buttons={
          <>
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            {exportButton}
          </>
        }
        header={commonText.export()}
        onClose={handleClose}
      >
        {actions}
      </Dialog>
    )
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
          headers: { Accept: 'text/plain' },
          errorMode: 'dismissible',
        }).then(({ data: xml }) => xml),
      [queryResource.id]
    ),
    true
  );

  return typeof exported === 'string' ? (
    <Dialog
      buttons={commonText.close()}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={queryText.exportQueryForDwca()}
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
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Info form={id('form')}>{commonText.create()}</Submit.Info>
        </>
      }
      header={asLabel ? headerText.createLabel() : headerText.createReport()}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ajax<SerializedResource<SpReport>>('/report_runner/create/', {
              method: 'POST',
              body: formData({
                queryid: queryResource.id,
                mimetype: asLabel ? 'jrxml/label' : 'jrxml/report',
                name: name.trim(),
              }),
              headers: {
                Accept: 'application/json',
              },
              errorMode: 'dismissible',
            })
              .then(async ({ data: reportJson }) => {
                const report = new tables.SpReport.Resource(reportJson);
                return report.rgetPromise('appResource');
              })
              .then((appResource) =>
                navigate(`/specify/appresources/${appResource.id}/`)
              )
          )
        }
      >
        <Input.Text
          aria-label={
            asLabel ? headerText.labelName() : headerText.reportName()
          }
          maxLength={getMaxLength()}
          placeholder={
            asLabel ? headerText.labelName() : headerText.reportName()
          }
          required
          title={asLabel ? headerText.labelName() : headerText.reportName()}
          value={name}
          onValueChange={(value): void => setName(value)}
        />
      </Form>
    </Dialog>
  );
}

const getMaxLength = (): number | undefined =>
  f.min(
    getField(tables.SpAppResource, 'name').length,
    getField(tables.SpReport, 'name').length
  );
