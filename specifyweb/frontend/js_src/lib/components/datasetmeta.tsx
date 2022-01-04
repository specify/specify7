import React from 'react';

import ajax from '../ajax';
import Backbone from '../backbone';
import { format } from '../dataobjformatters';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import resourceApi from '../resourceapi';
import schema from '../schema';
import type { RA } from '../types';
import userInfo from '../userinfo';
import uniquifyDataSetName from '../wbuniquifyname';
import { useId, useTitle } from './hooks';
import { DateElement, formatNumber } from './internationalization';
import { closeDialog, LoadingScreen, ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { Dataset } from './wbplanview';

async function fetchAgent(url: string): Promise<JSX.Element> {
  const agentId = resourceApi.idFromUrl(url);
  const createdByAgentResource = new schema.models.Agent.Resource({
    id: agentId,
  });
  return format(createdByAgentResource).then((formattedAgent: string) => (
    <a className="intercept-navigation" href={createdByAgentResource.viewUrl()}>
      {formattedAgent}
    </a>
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
  }, []);

  return (
    <ModalDialog
      properties={{
        title: wbText('dataSetMetaDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('close'),
            click: closeDialog,
          },
          {
            text: commonText('save'),
            click(): void {
              /* Submit form */
            },
            type: 'submit',
            form: id('form'),
          },
        ],
      }}
    >
      <form
        id={id('form')}
        onSubmit={(event): void => {
          event.preventDefault();

          void (
            name.trim() === dataset.name && remarks.trim() === dataset.remarks
              ? Promise.resolve(dataset.name)
              : uniquifyDataSetName(name.trim(), dataset.id).then(
                  async (uniqueName) =>
                    ajax(`/api/workbench/dataset/${dataset.id}/`, {
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
        <label>
          <b>{wbText('dataSetName')}</b>
          <input
            type="text"
            style={{
              display: 'block',
              width: '100%',
            }}
            spellCheck="true"
            value={name}
            onChange={({ target }): void => setName(target.value)}
          />
        </label>
        <br />
        <label>
          <b>{wbText('remarks')}</b>
          <textarea
            style={{ width: '100%' }}
            value={remarks}
            onChange={({ target }): void => setRemarks(target.value)}
          />
        </label>
        <br />
        <br />
        <b>{commonText('metadataInline')}</b>
        <br />
        {wbText('numberOfRows')} <i>{formatNumber(getRowCount())}</i>
        <br />
        {wbText('numberOfColumns')}{' '}
        <i>{formatNumber(dataset.columns.length)}</i>
        <br />
        {wbText('created')}{' '}
        <i>
          <DateElement date={dataset.timestampcreated} />
        </i>
        <br />
        {wbText('modified')}{' '}
        <i>
          <DateElement date={dataset.timestampmodified} />
        </i>
        <br />
        {wbText('uploaded')}{' '}
        <i>
          <DateElement
            date={dataset.uploadresult?.timestamp}
            fallback={commonText('no')}
          />
        </i>
        <br />
        {commonText('createdBy')} <i>{createdBy}</i>
        <br />
        {commonText('modifiedBy')} <i>{modifiedBy}</i>
        <br />
        {wbText('importedFileName')}{' '}
        <i>{dataset.importedfilename || wbText('noFileName')}</i>
      </form>
    </ModalDialog>
  );
}

function DataSetName({
  dataset,
  getRowCount,
}: {
  readonly dataset: Dataset;
  readonly getRowCount: () => number;
}): JSX.Element {
  const [showMeta, setShowMeta] = React.useState(false);
  const [name, setName] = React.useState(dataset.name);

  useTitle(name);

  return (
    <div>
      {' '}
      <h2 className="wb-name">
        {`${wbText('dataSet')} ${name}`}
        {dataset.uploadresult?.success === true ? (
          <span style={{ color: '#f24' }}>
            {wbText('dataSetUploadedLabel')}
          </span>
        ) : (
          ''
        )}
      </h2>
      <button
        type="button"
        className="magic-button"
        onClick={(): void => setShowMeta(true)}
      >
        {commonText('metadata')}
      </button>
      {showMeta && (
        <DataSetMeta
          dataset={dataset}
          onClose={(): void => {
            setShowMeta(false);
          }}
          getRowCount={getRowCount}
          onChange={(name): void => {
            setShowMeta(false);
            setName(name);
          }}
        />
      )}
    </div>
  );
}

const DataSetNameView = createBackboneView(DataSetName);

const fetchListOfUsers = async (): Promise<RA<SpecifyResource>> =>
  ajax<{ readonly objects: RA<SpecifyResource> }>(
    '/api/specify/specifyuser/?limit=500'
  ).then(({ data: { objects: users } }) =>
    users.filter(({ id }) => id !== userInfo.id)
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
  const [users, setUsers] = React.useState<RA<SpecifyResource> | undefined>(
    undefined
  );

  React.useEffect(() => {
    void fetchListOfUsers().then((users) =>
      destructorCalled ? undefined : setUsers(users)
    );

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, []);

  const id = useId('change-data-set-owner');
  const [newOwner, setNewOwner] = React.useState<number | undefined>(undefined);
  const [isChanged, setIsChanged] = React.useState(false);

  return typeof users === 'undefined' ? (
    <LoadingScreen />
  ) : isChanged ? (
    <ModalDialog
      properties={{
        title: wbText('dataSetOwnerChangedDialogTitle'),
        close: handleChanged,
      }}
    >
      ${wbText('dataSetOwnerChangedDialogHeader')}
      <p>${wbText('dataSetOwnerChangedDialogMessage')}</p>
    </ModalDialog>
  ) : (
    <ModalDialog
      properties={{
        title: wbText('changeDataSetOwnerDialogTitle'),
        close: handleClose,
        buttons: [
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
          {
            text: wbText('changeOwner'),
            click(): void {
              /* Submit form */
            },
            type: 'submit',
            form: id('form'),
          },
        ],
      }}
    >
      <form
        onSubmit={(event): void => {
          event.preventDefault();
          void ajax(`/api/workbench/transfer/${dataset.id}/`, {
            method: 'POST',
            body: {
              specifyuserid: newOwner,
            },
          }).then(() => setIsChanged(true));
        }}
      >
        {wbText('changeDataSetOwnerDialogHeader')}
        <label>
          <p>{wbText('changeDataSetOwnerDialogMessage')}</p>
          <select
            size={10}
            style={{ width: '100%' }}
            value={newOwner}
            onChange={({ target }): void =>
              setNewOwner(Number.parseInt(target.value))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.get('name') as string}
              </option>
            ))}
          </select>
        </label>
      </form>
    </ModalDialog>
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
    this.changeOwner = new ChangeOwnerView({
      dataset: this.options.dataset,
      onClose: handleClose,
      onChanged: (): void => navigation.go('/specify/'),
    }).render();
  },
  remove() {
    this.dataSetMeta.remove();
    this.changeOwner?.remove();
    Backbone.View.prototype.remove.call(this);
  },
});
