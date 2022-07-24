import { ping } from './ajax';

// FIXME: add back confirm navigation
const confirmNavigation = () => undefined;

export const switchCollection = (
  collection: number,
  nextUrl: string | undefined = undefined,
  cancelCallback: () => void = (): void => {
    /* Nothing */
  }
): void =>
  confirmNavigation(
    (): void =>
      void ping('/context/collection/', {
        method: 'POST',
        body: collection.toString(),
      }).then(() =>
        typeof nextUrl === 'string'
          ? globalThis.location.assign(nextUrl)
          : globalThis.location.reload()
      ),
    cancelCallback
  );
