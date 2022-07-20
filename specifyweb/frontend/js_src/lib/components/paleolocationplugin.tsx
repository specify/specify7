import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Locality } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import { hasTablePermission } from '../permissionutils';
import { toTable, toTables } from '../specifymodel';
import { filterArray } from '../types';
import { Button } from './basic';
import { LoadingContext } from './contexts';
import { ErrorBoundary } from './errorboundary';
import { Dialog } from './modaldialog';

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
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element | null {
  const [state, setState] = React.useState<States>({ type: 'MainState' });
  const loading = React.useContext(LoadingContext);

  return hasTablePermission('CollectingEvent', 'read') &&
    hasTablePermission('Locality', 'read') &&
    hasTablePermission('PaleoContext', 'read') ? (
    <ErrorBoundary dismissable>
      <Button.Small
        className="w-fit"
        id={id}
        onClick={(): void => loading(fetchPaleoData(resource).then(setState))}
      >
        {formsText('paleoMap')}
      </Button.Small>
      {state.type === 'InvalidTableState' && (
        <Dialog
          buttons={commonText('close')}
          header={formsText('unsupportedFormDialogHeader')}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
        >
          {formsText('unsupportedFormDialogText')}
        </Dialog>
      )}
      {state.type === 'NoDataState' && (
        <Dialog
          buttons={commonText('close')}
          header={formsText('paleoRequiresGeographyDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {formsText('paleoRequiresGeographyDialogText')}
        </Dialog>
      )}
      {state.type === 'LoadedState' && (
        <Dialog
          buttons={commonText('close')}
          header={formsText('paleoMap')}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          <iframe
            src={`https://paleolocation.org/map?lat=${state.latitude}&amp;lng=${state.longitude}&amp;ma=${state.age}&amp;embed`}
            style={{
              width: '800px',
              height: '600px',
            }}
            title={formsText('paleoMap')}
          />
        </Dialog>
      )}
    </ErrorBoundary>
  ) : null;
}

const fetchPaleoData = async (
  resource: SpecifyResource<AnySchema>
): Promise<States> =>
  f.maybe(
    toTables(resource, ['Locality', 'CollectionObject', 'CollectingEvent']),
    async (resource) => {
      const locality:
        | SpecifyResource<Locality>
        | 'InvalidTableState'
        | undefined =
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
              .then((collectingEvent) =>
                collectingEvent?.rgetPromise('locality')
              )
        )) ??
        'InvalidTableState';
      if (locality === 'InvalidTableState')
        return { type: 'InvalidTableState' };

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
        .then((paleoContext) => paleoContext?.rgetPromise('chronosStrat'));
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
  ) ?? { type: 'InvalidTableState' };
