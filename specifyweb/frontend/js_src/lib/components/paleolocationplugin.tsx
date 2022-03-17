import React from 'react';
import type { State } from 'typesafe-reducer';

import type { CollectionObject, Locality } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import { isResourceOfType } from '../specifymodel';
import { filterArray } from '../types';
import { Button } from './basic';
import { crash } from './errorboundary';
import { Dialog, LoadingScreen } from './modaldialog';

type States =
  | State<'MainState'>
  | State<'LoadingState'>
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
}): JSX.Element {
  const [state, setState] = React.useState<States>({ type: 'MainState' });

  return (
    <>
      <Button.Simple
        id={id}
        onClick={(): void => {
          setState({
            type: 'LoadingState',
          });
          fetchPaleoData(resource).then(setState).catch(crash);
          /*
           * .then((data) => (data ? openPaleoMap(data) : paleoRequired()))
           * .catch(crash)
           * .finally(handleLoaded);
           */
        }}
      >
        {formsText('paleoMap')}
      </Button.Simple>
      {state.type === 'LoadingState' && <LoadingScreen />}
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
  );
}

async function fetchPaleoData(
  resource: SpecifyResource<AnySchema>
): Promise<States> {
  const locality: SpecifyResource<Locality> | null | 'InvalidTableState' =
    isResourceOfType(resource, 'Locality')
      ? resource
      : isResourceOfType(resource, 'CollectingEvent')
      ? await resource.rgetPromise('locality', true)
      : isResourceOfType(resource, 'CollectionObject')
      ? await (resource as SpecifyResource<CollectionObject>)
          .rgetPromise('collectingEvent')
          .then((collectingEvent) =>
            collectingEvent?.rgetPromise('locality', true)
          )
      : 'InvalidTableState';
  if (locality === 'InvalidTableState') return { type: 'InvalidTableState' };

  const latitude = locality?.get('latitude1') ?? undefined;
  const longitude = locality?.get('longitude1') ?? undefined;

  if (typeof latitude === 'undefined' || typeof longitude === 'undefined')
    return { type: 'NoDataState' };

  /*
   * Because the paleo context is related directly to each of the possible forms in the same way
   * we can treat the retrieval of the age in the same all for all forms.
   */
  const chronosStrat = await (resource as SpecifyResource<Locality>)
    .rgetPromise('paleoContext')
    .then((paleoContext) => paleoContext?.rgetPromise('chronosStrat', true));
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
        age: periods / periods.length,
      };
}
