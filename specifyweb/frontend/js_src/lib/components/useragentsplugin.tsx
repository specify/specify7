import React from 'react';

import Backbone from '../backbone';
import type { Agent, Collection, Division, SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import QueryCbx from '../querycbx';
import { schema } from '../schema';
import type { RA } from '../types';
import { defined } from '../types';
import { group } from '../wbplanviewhelper';
import whenall from '../whenall';
import { Button, Form, Submit, Ul } from './basic';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';

// FIXME: rewrite this after QueryCbx
const AgentForDiv = Backbone.View.extend({
  initialize(options) {
    /*
     * Kind of kludgie but we need some resource with an agent field
     * for the QueryCBX to work with;
     */
    this.model = new schema.models.AgentAttachment.Resource();
    this.agent && this.model.set('agent', this.agent);
  },
  render() {
    this.el.innerHTML = `<label>
                ${this.division.get('name')}:
                <input type="text" name="agent">
            </label>`;

    new QueryCbx({
      populateForm: this.populateForm,
      el: $('input', this.el),
      model: this.model,
      relatedModel: schema.models.Agent,
      forceCollection: this.collection,
      hideButtons: true,
      init: { name: 'Agent' },
    }).render();

    return this;
  },
  save(user) {
    if (
      this.model.get('agent') != (this.agent && this.agent.get('resource_uri'))
    ) {
      this.model.rget('agent', true).done(this.gotNewAgent.bind(this, user));
    }
  },
  gotNewAgent(user, newAgent) {
    /*
     * The following is not atomic, but the ramifications of
     * one update succeeding without the other are not severe
     * enough to worry about. Someone will notice they can't
     * log in and then it can be fixed.
     */
    user
      .rget('agents', true)
      .pipe(function (agents) {
        return whenall(
          agents.map(function (agent) {
            return agent.set('specifyuser', null).save();
          })
        );
      })
      .pipe(function () {
        return newAgent && newAgent.set('specifyuser', user).save();
      });
  },
});

type Data = {
  readonly division: SpecifyResource<Division>;
  readonly collections: RA<SpecifyResource<Collection>>;
  readonly agent: SpecifyResource<Agent>;
};

function Entry({
  division,
  collections,
  agent,
  user,
}: Data & {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  return <li />;
}

function UserAgentsDialog({
  user,
  onClose: handleClose,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly onClose: () => void;
}): JSX.Element {
  const [entries] = useAsyncState<RA<Data>>(
    React.useCallback(async () => {
      const collections = new schema.models.Collection.LazyCollection();
      return Promise.all([
        collections
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
            ).then(group)
          ),
        user.rgetCollection('agents', true).then(({ models }) => models),
      ]).then(([division, agents]) =>
        Object.values(division).map((entries) => ({
          division: entries[0].division,
          collections: entries.map(({ collection }) => collection),
          agent: defined(
            agents.find(
              (agent) => agent.get('division') === division.get('resource_uri')
            )
          ),
        }))
      );
    }, [user])
  );

  const id = useId('user-agents-plugin');
  return typeof entries === 'undefined' ? (
    <LoadingScreen />
  ) : (
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
      <Form id={id('form')}>
        <Ul>
          {entries.map((entry) => (
            <Entry key={entry.collection.id} user={user} {...entry} />
          ))}
        </Ul>
      </Form>
    </Dialog>
  );
}

export function UserAgentsPlugin({
  user,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
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
      {isOpen && <UserAgentsDialog user={user} onClose={handleClose} />}
    </>
  );
}
