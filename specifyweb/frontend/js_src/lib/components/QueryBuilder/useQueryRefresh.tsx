import React from 'react';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { queryText } from '../../localization/query';
import { Button } from '../Atoms/Button';
import { Label, Select } from '../Atoms/Form';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { SpQuery } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { reconcileQuery, type QueryResolutions } from './reconcileQuery';

export function useQueryRefresh(
  resource: SpecifyResource<SpQuery>,
  getLocal = (): SerializedResource<SpQuery> => serializeResource(resource),
  onRefreshed?: (definition: SerializedResource<SpQuery>) => void
): {
  readonly savedQuery: React.MutableRefObject<SerializedResource<SpQuery>>;
  readonly refreshQuery: () => void;
  readonly conflictDialog: JSX.Element | null;
} {
  const savedQuery = React.useRef(serializeResource(resource));
  React.useEffect(() => {
    savedQuery.current = serializeResource(resource);
  }, [resource]);
  // Read edits made while the reload request was in flight.
  const latest = React.useRef({ getLocal, onRefreshed });
  latest.current = { getLocal, onRefreshed };
  const [pending, setPending] = React.useState<SerializedResource<SpQuery>>();
  const [resolutions, setResolutions] = React.useState<QueryResolutions>({});
  const loading = React.useContext(LoadingContext);

  function reconcile(
    server: SerializedResource<SpQuery>,
    choices: QueryResolutions = {}
  ): void {
    const result = reconcileQuery(
      savedQuery.current,
      latest.current.getLocal(),
      server,
      choices
    );
    if (result.conflicts.length > 0) {
      setPending(server);
      setResolutions(choices);
    } else {
      savedQuery.current = server;
      resource.bulkSet(result.definition);
      latest.current.onRefreshed?.(result.definition);
      setPending(undefined);
    }
  }
  const conflicts =
    pending === undefined
      ? []
      : reconcileQuery(savedQuery.current, getLocal(), pending).conflicts;

  return {
    savedQuery,
    refreshQuery: (): void =>
      loading(
        // A new resource bypasses fetch()'s populated-instance cache.
        new tables.SpQuery.Resource({ id: resource.id })
          .fetch()
          .then((server): void => reconcile(serializeResource(server)))
      ),
    conflictDialog:
      pending === undefined ? null : (
        <Dialog
          header={formsText.saveConflict()}
          onClose={(): void => setPending(undefined)}
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Button.Success
                disabled={conflicts.some(
                  ({ path }) => resolutions[path] === undefined
                )}
                onClick={(): void => reconcile(pending, resolutions)}
              >
                {commonText.apply()}
              </Button.Success>
            </>
          }
        >
          <p>{queryText.queryRefreshConflict()}</p>
          {conflicts.map(({ path, local, server }) => (
            <Label.Block key={path}>
              {path}
              <pre>
                {queryText.localQueryChanges()}: {JSON.stringify(local)}
              </pre>
              <pre>
                {queryText.serverQueryChanges()}: {JSON.stringify(server)}
              </pre>
              <Select
                value={resolutions[path] ?? ''}
                onValueChange={(value): void => {
                  if (value === 'local' || value === 'server')
                    setResolutions({
                      ...resolutions,
                      [path]: value === 'local' ? 'local' : 'server',
                    });
                }}
              >
                <option value="" disabled>
                  {queryText.chooseQueryChanges()}
                </option>
                <option value="local">{queryText.localQueryChanges()}</option>
                <option value="server">{queryText.serverQueryChanges()}</option>
              </Select>
            </Label.Block>
          ))}
        </Dialog>
      ),
  };
}
