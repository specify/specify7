/**
 * Fixes for various issues with default TypeScript declaration fils
 */

import type * as H from 'history';
import type { To } from 'history';

import type { SafeLocationState } from './components/Router/RouterState';
import type { IR, RA, RR, ValueOf } from './utils/types';

/**
 * Typescript does not recognize the definition overwrite when using
 * the other method signature style
 *
 * Here and in the following, a Shorthand method signature is used
 * to overwrite the default definitions
 */
/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable functional/no-method-signature */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable functional/prefer-readonly-type */

declare global {
  /**
   * Workaround for https://github.com/microsoft/TypeScript/issues/17002
   * Fix for Array.isArray() narrowing RA<T> to any[]
   */
  interface ArrayConstructor {
    isArray(argument: RA<any> | any): argument is RA<any>;
  }

  interface Array {
    /**
     * A fix for Array.from(someValue).fill(otherValue) getting its type
     * from someValue rather than otherValue
     */
    fill<V>(value: V): RA<V>;

    // This won't be needed in TypeScript 5.0. See https://github.com/microsoft/TypeScript/issues/48829
    findLastIndex(
      predicate: (value: T, index: number, array: T[]) => unknown
    ): number;
  }

  interface ReadonlyArray<T> {
    findLastIndex(
      predicate: (value: T, index: number, array: T[]) => unknown
    ): number;
  }

  /**
   * Prevent Object.entries() and Object.fromEntries() from widening key
   * type to string
   */
  interface ObjectConstructor {
    // Object
    entries<DICTIONARY extends IR<unknown>>(
      object: DICTIONARY
    ): [
      keyof DICTIONARY extends number ? string : string & keyof DICTIONARY,
      ValueOf<DICTIONARY>,
    ][];

    // Array
    entries<ITEM>(array: RA<ITEM>): [string, ITEM][];

    // Prevent Object.fromEntries() from widening the key type to string
    fromEntries<KEYS extends PropertyKey, VALUES>(
      entries: Iterable<readonly [KEYS, VALUES]>
    ): RR<KEYS, VALUES>;

    // Prevent Object.keys() from widening the key type to string[]
    keys<KEY extends string>(object: RR<KEY, unknown>): RA<KEY>;
  }

  interface PromiseConstructor {
    all<T>(values: Iterable<PromiseLike<T> | T>): Promise<RA<Awaited<T>>>;
  }
}

// Make router state more type safe
declare module 'react-router' {
  export type SafeNavigateFunction = (
    to: To,
    options?: {
      readonly replace?: boolean;
      readonly state?: SafeLocationState;
    }
  ) => void;

  export declare function useNavigate(): (
    to: To,
    options?: {
      readonly replace?: boolean;
      readonly state?: SafeLocationState;
    }
  ) => void;

  export declare function useLocation(): H.Location<SafeLocationState>;
}

declare module 'history' {
  export type SafeLocation = Location<SafeLocationState>;
}

// Allow SVGs to be imported as strings
declare module '*.svg' {
  const content: string;
  export default content;
}

/* eslint-enable @typescript-eslint/method-signature-style */
/* eslint-enable functional/no-method-signature */
/* eslint-enable @typescript-eslint/consistent-type-definitions */
/* eslint-enable functional/prefer-readonly-type */
