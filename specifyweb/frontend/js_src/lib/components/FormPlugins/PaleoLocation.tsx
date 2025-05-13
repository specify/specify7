import React from 'react';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { formatDisjunction } from '../Atoms/Internationalization';
import { LoadingContext } from '../Core/Contexts';
import { toTable, toTables } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { genericTables, tables } from '../DataModel/tables';
import type { Locality } from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';

type States =
  | State<
      'LoadedState',
      {
        readonly latitude: number;
        readonly longitude: number;
        readonly age: number;
      }
    >
  | State<'InvalidTableState'>
  | State<'MainState'>
  | State<'NoDataState'>;

export function PaleoLocationMapPlugin({
  id,
  resource,
}: {
  readonly id: string | undefined;
  readonly resource: SpecifyResource<AnySchema> | undefined;
}): JSX.Element | null {
  const [state, setState] = React.useState<States>({ type: 'MainState' });
  const loading = React.useContext(LoadingContext);

  return typeof resource === 'object' &&
    hasTablePermission('CollectingEvent', 'read') &&
    hasTablePermission('Locality', 'read') &&
    hasTablePermission('PaleoContext', 'read') ? (
    <ErrorBoundary dismissible>
      <Button.Small
        className="w-fit"
        id={id}
        onClick={(): void => loading(fetchPaleoData(resource).then(setState))}
      >
        {formsText.paleoMap()}
      </Button.Small>
      {state.type === 'InvalidTableState' && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.pluginNotAvailable()}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
        >
          {formsText.wrongTableForPlugin({
            currentTable: resource.specifyTable.name,
            supportedTables: formatDisjunction(
              paleoPluginTables.map((name) => genericTables[name].label)
            ),
          })}
        </Dialog>
      )}
      {state.type === 'NoDataState' && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.paleoRequiresGeography({
            geographyTable: tables.Geography.label,
          })}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {formsText.paleoRequiresGeographyDescription({
            localityTable: tables.Locality.label,
          })}
        </Dialog>
      )}
      {state.type === 'LoadedState' && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.paleoMap()}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          <iframe
            src={`https://paleolocation.org/map?lat=${state.latitude}&amp;lng=${state.longitude}&amp;ma=${state.age}&amp;embed`}
            style={{
              width: '800px',
              height: '600px',
            }}
            title={formsText.paleoMap()}
          />
        </Dialog>
      )}
    </ErrorBoundary>
  ) : null;
}

export const paleoPluginTables = [
  'Locality',
  'CollectionObject',
  'CollectingEvent',
] as const;

async function fetchPaleoData(
  anyResource: SpecifyResource<AnySchema>
): Promise<States> {
  const resource = toTables(anyResource, paleoPluginTables);
  if (resource === undefined)
    throw new Error('Trying to display PaleoMap unsupported form');

  const locality: SpecifyResource<Locality> | 'InvalidTableState' | undefined =
    toTable(resource, 'Locality') ??
    (await f.maybe(
      toTable(resource, 'CollectingEvent'),
      async (collectingEvent) => collectingEvent.rgetPromise('locality')
    )) ??
    (await f.maybe(
      toTable(resource, 'CollectionObject'),
      async (collectionObject) =>
        collectionObject
          .rgetPromise('collectingEvent')
          .then(async (collectingEvent) =>
            collectingEvent?.rgetPromise('locality')
          )
    )) ??
    'InvalidTableState';
  if (locality === 'InvalidTableState') return { type: 'InvalidTableState' };

  const latitude = locality?.get('latitude1') ?? undefined;
  const longitude = locality?.get('longitude1') ?? undefined;

  if (latitude === undefined || longitude === undefined)
    return { type: 'NoDataState' };

  /*
   * Because the paleo context is related directly to each of the possible forms in the same way
   * we can treat the retrieval of the age in the same all for all forms.
   */
  const chronosStrat = await resource
    .rgetPromise('paleoContext')
    .then(async (paleoContext) => paleoContext?.rgetPromise('chronosStrat'));
  const startPeriod = chronosStrat?.get('startPeriod') ?? undefined;
  const endPeriod = chronosStrat?.get('endPeriod') ?? undefined;

  // Calculate the mid-point of the age if possible
  const periods = filterArray([startPeriod, endPeriod]);
  return periods.length === 0
    ? { type: 'NoDataState' }
    : {
        type: 'LoadedState',
        latitude,
        longitude,
        age: f.sum(periods) / periods.length,
      };
}
