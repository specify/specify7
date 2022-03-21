import React from 'react';

import type {
  Address,
  Agent,
  Collection,
  Division,
  SpecifyUser,
} from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { FormMode, FormType } from '../parseform';
import { schema } from '../schema';
import type { RA } from '../types';
import { f, group } from '../wbplanviewhelper';
import { Button, Form, Label, Submit, Ul } from './basic';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import { QueryComboBox } from './querycombobox';
import { LoadingContext } from './contexts';

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
  formType,
}: Data & {
  readonly isRequired: boolean;
  readonly mode: FormMode;
  readonly formType: FormType;
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
          formType={formType}
          isRequired={isRequired}
          relatedModel={schema.models.Agent}
          forceCollection={collection.id}
          typeSearch="Agent"
        />
      </Label.Generic>
    </li>
  );
}

function UserAgentsDialog({
  user,
  onClose: handleClose,
  mode,
  formType,
  isRequired,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly onClose: () => void;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly isRequired: boolean;
}): JSX.Element | null {
  const [entries] = useAsyncState<RA<Data>>(
    React.useCallback(async () => {
      const collections = new schema.models.Collection.LazyCollection();
      return f
        .all({
          division: collections
            .fetchPromise({ limit: 0 })
            .then(async ({ models }) =>
              Promise.all(
                models.map(async (collection) =>
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
               * for the QueryCBX to work with;
               */
              address: new schema.models.Address.Resource().set(
                'agent',
                entry.agent ?? null
              ),
            }))
        );
    }, [user]),
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
          <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
        </>
      }
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            Promise.all(
              entries.map((entry) =>
                entry.address.get('agent') === entry.agent?.get('resource_uri')
                  ? undefined
                  : entry.address
                      .rgetPromise('agent', true)
                      .then(async (newAgent) =>
                        /*
                         * The following is not atomic, but the ramifications of
                         * one update succeeding without the other are not severe
                         * enough to worry about. Someone will notice they can't
                         * log in and then it can be fixed.
                         */
                        user
                          .rgetCollection('agents', true)
                          .then(async ({ models: agents }) =>
                            Promise.all(
                              agents.map(async (agent) =>
                                agent.set('specifyUser', null).save()
                              )
                            ).then(() =>
                              newAgent?.set('specifyUser', user).save()
                            )
                          )
                      )
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
              formType={formType}
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
  id,
  mode,
  formType,
  isRequired,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly id: string | undefined;
  readonly mode: FormMode;
  readonly formType: FormType;
  readonly isRequired: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
        id={id}
        disabled={user.isNew()}
        title={
          user.isNew()
            ? formsText('setAgentsDisabledButtonDescription')
            : undefined
        }
        onClick={handleOpen}
      >
        {formsText('setAgents')}
      </Button.Simple>
      {isOpen && (
        <UserAgentsDialog
          user={user}
          onClose={handleClose}
          mode={mode}
          formType={formType}
          isRequired={isRequired}
        />
      )}
    </>
  );
}
