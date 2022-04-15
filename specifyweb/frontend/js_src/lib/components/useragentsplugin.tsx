import React from 'react';

import { ajax, Http } from '../ajax';
import { f } from '../functools';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { FormMode } from '../parseform';
import { fetchResource, idFromUrl } from '../resource';
import { schema } from '../schema';
import type { RA } from '../types';
import { defined, filterArray } from '../types';
import { Button, ErrorMessage, Form, Label, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useId } from './hooks';
import { Dialog } from './modaldialog';
import { QueryComboBox } from './querycombobox';
import type { UserAgents } from './securityuserhooks';

export type SetAgentsResponse = Partial<{
  AgentInUseException: RA<number>;
  MultipleAgentsException: RA<{
    readonly divisionid: number;
    readonly agentid1: number;
    readonly agentid2: number;
  }>;
  MissingAgentForAccessibleCollection: {
    readonly all_accessible_divisions: RA<number>;
    readonly missing_for_6: RA<number>;
    readonly missing_for_7: RA<number>;
  };
}>;

/**
 * If user is missing agents for some accessible collections, this dialog
 * would ask them to assign the missing agents
 */
export function UserAgentsDialog({
  userAgents,
  userId,
  onClose: handleClose,
  mode,
  response: initialResponse,
}: {
  readonly userAgents: UserAgents | undefined;
  readonly userId: number;
  readonly onClose: () => void;
  readonly mode: FormMode;
  readonly response: SetAgentsResponse;
}): JSX.Element | null {
  const [response, setResponse] = React.useState(initialResponse);

  const [data] = useAsyncState(
    React.useCallback(
      async () =>
        typeof userAgents === 'object'
          ? Promise.all(
              userAgents.map(async ({ divisionId, ...rest }) =>
                fetchResource('Division', divisionId).then((division) => ({
                  division: defined(division),
                  isRequired:
                    response.MissingAgentForAccessibleCollection?.all_accessible_divisions.includes(
                      divisionId
                    ) === true,
                  ...rest,
                }))
              )
            )
          : undefined,
      [userAgents, response]
    ),
    true
  );

  const id = useId('user-agents-plugin');
  const loading = React.useContext(LoadingContext);
  return Array.isArray(data) ? (
    <Dialog
      header={formsText('userAgentsPluginDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
        </>
      }
    >
      <p>{adminText('setAgentsDialogMessage')}</p>
      {/* Not formatting this error nicely, as it shouldn't ever happen */}
      {Array.isArray(response.MultipleAgentsException) && (
        <pre>{JSON.stringify(response, null, '2')}</pre>
      )}
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ajax(
              `/api/set_agents/${userId}/`,
              {
                method: 'POST',
                headers: {},
                body: filterArray(
                  defined(userAgents).map(({ address }) =>
                    idFromUrl(address.get('agent') ?? '')
                  )
                ),
              },
              {
                expectedResponseCodes: [Http.OK, Http.NO_CONTENT],
              }
            ).then(({ data, status }) =>
              status === Http.OK ? handleClose() : setResponse(JSON.parse(data))
            )
          )
        }
      >
        <Ul>
          {data.map(({ division, collections, address, isRequired }) => (
            <Label.Generic key={division.id}>
              {division.name}
              <QueryComboBox
                id={undefined}
                fieldName="agent"
                resource={address}
                mode={mode}
                formType="form"
                isRequired={isRequired}
                relatedModel={schema.models.Agent}
                /*
                 * Since Agents are scoped to Division, scoping the query to any
                 * collection in that division would scope results to
                 * Division
                 */
                forceCollection={collections[0]}
                typeSearch="Agent"
              />
              {f.includes(
                response.AgentInUseException ?? [],
                idFromUrl(address.get('agent') ?? '')
              ) && <ErrorMessage>{adminText('agentInUse')}</ErrorMessage>}
            </Label.Generic>
          ))}
        </Ul>
      </Form>
    </Dialog>
  ) : null;
}
