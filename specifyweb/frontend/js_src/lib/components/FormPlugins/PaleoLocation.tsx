import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Locality } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { hasTablePermission } from '../Permissions/helpers';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { AnySchema } from '../DataModel/helperTypes';
import { toTable, toTables } from '../DataModel/helpers';

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
        {formsText.paleoMap()}
      </Button.Small>
      {state.type === 'InvalidTableState' && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.unsupportedForm()}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
        >
          {formsText.unsupportedFormDescription()}
        </Dialog>
      )}
      {state.type === 'NoDataState' && (
        <Dialog
          buttons={commonText.close()}
          header={formsText.paleoRequiresGeography()}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          {formsText.paleoRequiresGeographyDescription()}
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
