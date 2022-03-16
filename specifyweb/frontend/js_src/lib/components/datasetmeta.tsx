import React from 'react';

import { ping } from '../ajax';
import Backbone from '../backbone';
import { fetchCollection } from '../collection';
import type { SpecifyUser } from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { format } from '../dataobjformatters';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import { idFromUrl } from '../resource';
import { schema } from '../schema';
import type { RA } from '../types';
import { userInformation } from '../userinfo';
import { uniquifyDataSetName } from '../wbuniquifyname';
import {
  Button,
  Form,
  Input,
  Label,
  Link,
  Select,
  Submit,
  Textarea,
} from './basic';
import { useAsyncState, useBooleanState, useId, useTitle } from './hooks';
import { DateElement, formatNumber } from './internationalization';
import { Dialog, LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { Dataset } from './wbplanview';

async function fetchAgent(url: string): Promise<JSX.Element> {
  const createdByAgentResource = new schema.models.Agent.Resource({
    id: idFromUrl(url),
  });
  return format(createdByAgentResource).then((formattedAgent) => (
    <Link.Default href={createdByAgentResource.viewUrl()}>
      {formattedAgent}
    </Link.Default>
  ));
}

export function DataSetMeta({
  dataset,
  getRowCount = (): number => dataset.rows.length,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly dataset: Dataset;
  readonly getRowCount?: () => number;
  readonly onClose: () => void;
  readonly onChange: (dataSetName: string) => void;
}): JSX.Element | null {
  const id = useId('data-set-meta');
  const [name, setName] = React.useState(dataset.name);
  const [remarks, setRemarks] = React.useState(dataset.remarks ?? '');
  const [createdBy, setCreatedBy] = React.useState<JSX.Element | string>(
    commonText('loading')
  );
  const [modifiedBy, setModifiedBy] = React.useState<JSX.Element | string>(
    commonText('loading')
  );

  React.useEffect(() => {
    const sameAgent = dataset.createdbyagent === dataset.modifiedbyagent;
    const createdByAgent = fetchAgent(dataset.createdbyagent);
    const modifiedByAgent =
      sameAgent || typeof dataset.modifiedbyagent !== 'string'
        ? Promise.resolve(commonText('notApplicable'))
        : fetchAgent(dataset.modifiedbyagent);

    Promise.all([createdByAgent, modifiedByAgent])
      .then(([createdByAgent, modifiedByAgent]) => {
        setCreatedBy(createdByAgent);
        setModifiedBy(sameAgent ? createdByAgent : modifiedByAgent);
      })
      .catch(console.error);
  }, [dataset.createdbyagent, dataset.modifiedbyagent]);

  return (
    <Dialog
      header={wbText('dataSetMetaDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();

          void (
            name.trim() === dataset.name && remarks.trim() === dataset.remarks
              ? Promise.resolve(dataset.name)
              : uniquifyDataSetName(name.trim(), dataset.id).then(
                  async (uniqueName) =>
                    ping(`/api/workbench/dataset/${dataset.id}/`, {
                      method: 'PUT',
                      body: { name: uniqueName, remarks: remarks.trim() },
                    }).then(() => {
                      // @ts-expect-error Modifying readonly value
                      dataset.name = uniqueName;
                      // @ts-expect-error Modifying readonly value
                      dataset.remarks = remarks.trim();
                      return uniqueName;
                    })
                )
          ).then((name) => handleChange(name));
        }}
      >
        <Label.Generic>
          <b>{wbText('dataSetName')}</b>
          <Input.Text
            spellCheck="true"
            value={name}
            onValueChange={setName}
            required
          />
        </Label.Generic>
        <Label.Generic>
          <b>{wbText('remarks')}</b>
          <Textarea value={remarks} onValueChange={setRemarks} />
        </Label.Generic>
        <div className="flex flex-col">
          <b>{commonText('metadataInline')}</b>
          <span>
            {wbText('numberOfRows')}
            <i>{formatNumber(getRowCount())}</i>
          </span>
          <span>
            {wbText('numberOfColumns')}{' '}
            <i>{formatNumber(dataset.columns.length)}</i>
          </span>
          <span>
            {wbText('created')}{' '}
            <i>
              <DateElement date={dataset.timestampcreated} flipDates />
            </i>
          </span>
          <span>
            {wbText('modified')}{' '}
            <i>
              <DateElement date={dataset.timestampmodified} flipDates />
            </i>
          </span>
          <span>
            {wbText('uploaded')}{' '}
            <i>
              <DateElement
                date={dataset.uploadresult?.timestamp}
                fallback={commonText('no')}
                flipDates
              />
            </i>
          </span>
          <span>
            {commonText('createdBy')} <i>{createdBy}</i>
          </span>
          <span>
            {commonText('modifiedBy')} <i>{modifiedBy}</i>
          </span>
          <span>
            {wbText('importedFileName')}{' '}
            <i>{dataset.importedfilename || wbText('noFileName')}</i>
          </span>
        </div>
      </Form>
    </Dialog>
  );
}

function DataSetName({
  dataset,
  getRowCount,
}: {
  readonly dataset: Dataset;
  readonly getRowCount: () => number;
}): JSX.Element {
  const [showMeta, handleOpen, handleClose] = useBooleanState();
  const [name, setName] = React.useState(dataset.name);

  useTitle(name);

  return (
    <>
      {' '}
      <h2 className="gap-x-1 flex overflow-y-auto">
        {`${wbText('dataSet')} ${name}`}
        {dataset.uploadresult?.success === true ? (
          <span className="text-red-600">{wbText('dataSetUploadedLabel')}</span>
        ) : (
          ''
        )}
      </h2>
      <Button.Simple onClick={handleOpen}>
        {commonText('metadata')}
      </Button.Simple>
      {showMeta && (
        <DataSetMeta
          dataset={dataset}
          onClose={handleClose}
          getRowCount={getRowCount}
          onChange={(name): void => {
            handleClose();
            setName(name);
          }}
        />
      )}
    </>
  );
}

const DataSetNameView = createBackboneView(DataSetName);

const fetchListOfUsers = async (): Promise<
  RA<SerializedResource<SpecifyUser>>
> =>
  fetchCollection('SpecifyUser', { limit: 500 }).then(({ records: users }) =>
    users.filter(({ id }) => id !== userInformation.id)
  );

function ChangeOwner({
  dataset,
  onClose: handleClose,
  onChanged: handleChanged,
}: {
  readonly dataset: Dataset;
  readonly onClose: () => void;
  readonly onChanged: () => void;
}): JSX.Element {
  const [users] =
    useAsyncState<RA<SerializedResource<SpecifyUser>>>(fetchListOfUsers);

  const id = useId('change-data-set-owner');
  const [newOwner, setNewOwner] = React.useState<number | undefined>(undefined);
  const [isChanged, setIsChanged] = React.useState(false);

  return typeof users === 'undefined' ? (
    <LoadingScreen />
  ) : isChanged ? (
    <Dialog
      title={wbText('dataSetOwnerChangedDialogTitle')}
      header={wbText('dataSetOwnerChangedDialogHeader')}
      onClose={handleChanged}
      buttons={commonText('close')}
    >
      <p>{wbText('dataSetOwnerChangedDialogMessage')}</p>
    </Dialog>
  ) : (
    <Dialog
      title={wbText('changeDataSetOwnerDialogTitle')}
      header={wbText('changeDataSetOwnerDialogHeader')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{wbText('changeOwner')}</Submit.Blue>
        </>
      }
    >
      <Form
        onSubmit={(event): void => {
          event.preventDefault();
          void ping(`/api/workbench/transfer/${dataset.id}/`, {
            method: 'POST',
            body: {
              specifyuserid: newOwner,
            },
            headers: {
              Accept: 'application/json',
            },
          }).then(() => setIsChanged(true));
        }}
      >
        <Label.Generic>
          <p>{wbText('changeDataSetOwnerDialogMessage')}</p>
          <Select
            size={10}
            value={newOwner}
            onChange={({ target }): void =>
              setNewOwner(Number.parseInt(target.value))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Label.Generic>
      </Form>
    </Dialog>
  );
}

const ChangeOwnerView = createBackboneView(ChangeOwner);

// A wrapper for DS Meta for embedding in the WB
export default Backbone.View.extend({
  __name__: 'DataSetNameView',
  render() {
    this.dataSetMeta = new DataSetNameView({
      el: this.el.getElementsByClassName('wb-name-container')[0],
      dataset: this.options.dataset,
      getRowCount: this.options.getRowCount,
    }).render();
    return this;
  },
  changeOwner() {
    const handleClose = (): void => void this.changeOwner.remove();
    this.changeOwnerView = new ChangeOwnerView({
      dataset: this.options.dataset,
      onClose: handleClose,
      onChanged: (): void => navigation.go('/specify/'),
    }).render();
  },
  remove() {
    this.dataSetMeta.remove();
    this.changeOwnerView?.remove();
    Backbone.View.prototype.remove.call(this);
  },
});
