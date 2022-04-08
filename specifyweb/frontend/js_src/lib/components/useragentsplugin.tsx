import React from 'react';

import type {
  Address,
  Agent,
  Collection,
  Division,
  SpecifyUser,
} from '../datamodel';
import { f } from '../functools';
import { group } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode } from '../parseform';
import { idFromUrl } from '../resource';
import { schema } from '../schema';
import type { RA } from '../types';
import { Button, Form, Label, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import { QueryComboBox } from './querycombobox';
import { fetchCollection } from '../collection';
import { deserializeResource } from './resource';
import { SerializedResource } from '../datamodelutils';

type Data = {
  readonly division: SpecifyResource<Division>;
  readonly collection: SpecifyResource<Collection>;
  readonly agent: SpecifyResource<Agent> | undefined;
  readonly address: SpecifyResource<Address>;
};

function Entry({
  division,
  collection,
  address,
  isRequired,
  mode,
}: Data & {
  readonly isRequired: boolean;
  readonly mode: FormMode;
}): JSX.Element {
  return (
    <li>
      <Label.Generic>
        {division.get('name')}
        <QueryComboBox
          id={undefined}
          fieldName="agent"
          resource={address}
          mode={mode}
          formType="form"
          isRequired={isRequired}
          relatedModel={schema.models.Agent}
          forceCollection={collection.id}
          typeSearch="Agent"
        />
      </Label.Generic>
    </li>
  );
}

function SetDivisionAgent({
  divisionId,
  userId,
}: {
  readonly divisionId: number;
  readonly userId: number;
}): JSX.Element {
  const [agent, setAgent] = useAsyncState(() => {}, [divisionId, userId]);
}

// http://localhost/api/specify/agent/?specifyuser=8
function UserAgentsDialog({
  user,
  onClose: handleClose,
  mode,
  isRequired,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly onClose: () => void;
  readonly mode: FormMode;
  readonly isRequired: boolean;
}): JSX.Element | null {
  const [entries] = useAsyncState<RA<Data>>(
    React.useCallback(
      async () =>
        f
          .all({
            division: fetchCollection('Collection', { limit: 0 })
              .then(async ({ records }) =>
                Promise.all(
                  records
                    .map(deserializeResource)
                    .map(async (collection) =>
                      collection
                        .rgetPromise('discipline')
                        .then(async (discipline) =>
                          discipline
                            .rgetPromise('division', true)
                            .then(
                              (division) =>
                                [division.id, { division, collection }] as const
                            )
                        )
                    )
                )
              )
              .then(group),
            agents: user
              .rgetCollection('agents', true)
              .then(({ models }) => models),
          })
          .then(({ division, agents }) =>
            Object.values(division)
              .map((entries) => ({
                division: entries[0].division,
                /*
                 * Not sure how user agents plugin should behave when there are more
                 * than one collection in a division. QueryComboBox interacts with
                 * the back-end API which only allows restricting search results
                 * by one collection at a time
                 */
                collection: entries.map(({ collection }) => collection)[0],
                agent: agents.find(
                  (agent) =>
                    agent.get('division') ===
                    entries[0].division.get('resource_uri')
                ),
              }))
              .map((entry) => ({
                ...entry,
                /*
                 * Kind of kludge but we need some resource with an agent field
                 * for the QueryCBX to work with
                 */
                address: new schema.models.Address.Resource().set(
                  'agent',
                  entry.agent ?? null
                ),
              }))
          ),
      [user]
    ),
    true
  );

  const id = useId('user-agents-plugin');
  const loading = React.useContext(LoadingContext);
  return typeof entries === 'undefined' ? null : (
    <Dialog
      header={formsText('userAgentsPluginDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          {<Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>}
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            Promise.all(
              entries.flatMap((entry) =>
                entry.address.get('agent') === entry.agent?.get('resource_uri')
                  ? undefined
                  : [
                      f
                        .maybe(
                          f.maybe(entry.agent?.get('resource_uri'), idFromUrl),
                          async (id) => {
                            const oldAgent = new schema.models.Agent.Resource({
                              id,
                            });
                            return oldAgent.fetch();
                          }
                        )
                        ?.then((oldAgent) =>
                          oldAgent.set('specifyUser', null).save()
                        ),
                      entry.address
                        .rgetPromise('agent', true)
                        .then((newAgent) =>
                          newAgent?.set('specifyUser', user).save()
                        ),
                    ]
              )
            ).finally(handleClose)
          )
        }
      >
        <Ul>
          {entries.map((entry) => (
            <Entry
              key={entry.division.id}
              {...entry}
              mode={mode}
              isRequired={isRequired}
            />
          ))}
        </Ul>
      </Form>
    </Dialog>
  );
}

export function UserAgentsPlugin({
  user,
  mode,
  isRequired,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly mode: FormMode;
  readonly isRequired: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple onClick={handleOpen}>
        {formsText('setAgents')}
      </Button.Simple>
      {isOpen && (
        <UserAgentsDialog
          user={user}
          onClose={handleClose}
          mode={mode}
          isRequired={isRequired}
        />
      )}
    </>
  );
}
