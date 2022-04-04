import React from 'react';
import type { State } from 'typesafe-reducer';

import type { Locality } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { filterArray } from '../types';
import { f } from '../functools';
import { Button } from './basic';
import { Dialog } from './modaldialog';
import { toTable, toTables } from '../specifymodel';
import { LoadingContext } from './contexts';
import { hasTablePermission } from '../permissions';

type States =
  | State<'MainState'>
  | State<'InvalidTableState'>
  | State<'NoDataState'>
  | State<
      'LoadedState',
      {
        readonly latitude: number;
        readonly longitude: number;
        readonly age: number;
      }
    >;

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
    <>
      <Button.Simple
        id={id}
        onClick={(): void => loading(fetchPaleoData(resource).then(setState))}
        className="w-fit"
      >
        {formsText('paleoMap')}
      </Button.Simple>
      {state.type === 'InvalidTableState' && (
        <Dialog
          title={formsText('unsupportedFormDialogTitle')}
          header={formsText('unsupportedFormDialogHeader')}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
          buttons={commonText('close')}
        >
          {formsText('unsupportedFormDialogMessage')}
        </Dialog>
      )}
      {state.type === 'NoDataState' && (
        <Dialog
          title={formsText('paleoRequiresGeographyDialogTitle')}
          header={formsText('paleoRequiresGeographyDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
          buttons={commonText('close')}
        >
          {formsText('paleoRequiresGeographyDialogMessage')}
        </Dialog>
      )}
      {state.type === 'NoDataState' && (
        <Dialog
          title={formsText('paleoRequiresGeographyDialogTitle')}
          header={formsText('paleoRequiresGeographyDialogHeader')}
          onClose={(): void => setState({ type: 'MainState' })}
          buttons={commonText('close')}
        >
          {formsText('paleoRequiresGeographyDialogMessage')}
        </Dialog>
      )}
      {state.type === 'LoadedState' && (
        <Dialog
          header={formsText('paleoMap')}
          buttons={commonText('close')}
          onClose={(): void => setState({ type: 'MainState' })}
        >
          <iframe
            title={formsText('paleoMap')}
            src={`https://paleolocation.org/map?lat=${state.latitude}&amp;lng=${state.longitude}&amp;ma=${state.age}&amp;embed`}
            style={{
              width: '800px',
              height: '600px',
            }}
          />
        </Dialog>
      )}
    </>
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
        | undefined
        | 'InvalidTableState' =
        toTable(resource, 'Locality') ??
        (await f.maybe(
          toTable(resource, 'CollectingEvent'),
          async (collectingEvent) =>
            collectingEvent.rgetPromise('locality', true)
        )) ??
        (await f.maybe(
          toTable(resource, 'CollectionObject'),
          (collectionObject) =>
            collectionObject
              .rgetPromise('collectingEvent')
              .then((collectingEvent) =>
                collectingEvent?.rgetPromise('locality', true)
              )
        )) ??
        'InvalidTableState';
      if (locality === 'InvalidTableState')
        return { type: 'InvalidTableState' };

      const latitude = locality?.get('latitude1') ?? undefined;
      const longitude = locality?.get('longitude1') ?? undefined;

      if (typeof latitude === 'undefined' || typeof longitude === 'undefined')
        return { type: 'NoDataState' };

      /*
       * Because the paleo context is related directly to each of the possible forms in the same way
       * we can treat the retrieval of the age in the same all for all forms.
       */
      const chronosStrat = await resource
        .rgetPromise('paleoContext')
        .then((paleoContext) =>
          paleoContext?.rgetPromise('chronosStrat', true)
        );
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
