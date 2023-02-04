import React from 'react';
import type { State } from 'typesafe-reducer';

import type { SerializedResource } from '../DataModel/helperTypes';
import { AnySchema } from '../DataModel/helperTypes';
import type {
  SpAppResource,
  SpecifyUser,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import { isOverlay, OverlayContext } from './Router';
import { NewRole, Role } from '../Security/Role';
import { SafeLocation } from 'history';

/*
 * Symbol() would be better suites for this, but it can't be used because
 * state must be serializable
 */
type PureLocationState =
  | State<
      'AppResource',
      {
        readonly resource?: SerializedResource<SpAppResource | SpViewSetObject>;
        readonly directoryKey?: string;
        readonly initialDataFrom?: number;
      }
    >
  | State<
      'BackgroundLocation',
      {
        readonly location: SafeLocation;
      }
    >
  | State<
      'RecordSet',
      {
        readonly resource: SerializedResource<AnySchema> | undefined;
        readonly recordSetItemIndex?: number;
      }
    >
  | State<
      'Command',
      {
        readonly nextUrl: string;
      }
    >
  | State<
      'SecurityRole',
      {
        readonly role?: NewRole | Role;
      }
    >
  | State<
      'SecurityUser',
      {
        readonly user?: SerializedResource<SpecifyUser>;
        readonly initialCollectionId?: number;
      }
    >
  | State<'NotFoundPage'>;
export type SafeLocationState = PureLocationState | undefined;

/**
 * For non-overlay components, opening an overlay changes the location,
 * which is not desirable. This hook remembers if it was called from a
 * non-overlay component, and, if so, continues to serve the non-overlay
 * location
 */
export function useStableLocation(location: SafeLocation): SafeLocation {
  const state = location.state;

  const isOverlayOpen = state?.type === 'BackgroundLocation';
  const isOverlayComponent = isOverlay(React.useContext(OverlayContext));
  /*
   * If non-overlay listens for a state, and you open an overlay, the
   * previous state value should be used
   */
  const freezeValue = isOverlayComponent !== isOverlayOpen;

  const locationRef = React.useRef(location);
  if (!freezeValue) locationRef.current = location;

  return locationRef.current;
}

export function locationToState<TYPE extends PureLocationState['type']>(
  location: SafeLocation,
  type: TYPE
): Extract<PureLocationState, State<TYPE>> | undefined {
  const state = location.state;
  return state?.type === type
    ? (state as Extract<PureLocationState, State<TYPE>>)
    : undefined;
}
