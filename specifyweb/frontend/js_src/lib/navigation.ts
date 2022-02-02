import $ from 'jquery';

import { isExternalUrl, ping } from './ajax';
import Backbone from './backbone';
import commonText from './localization/common';

/*
 * We introduce a sequence variable that is incremented and passed in
 * the state argument of each history.pushState invocation. When a
 * popstate event occurs, we can use the relative sequence values to
 * 'undo' the popstate in the case that the user elects not to leave
 * the current context.
 */

type State = {
  sequence?: number;
};
const sequenceFromState = (state?: State): number =>
  typeof state?.sequence === 'number' ? state.sequence : 0;

// If the page is reloaded, the sequence needs to be set from the stored state.
let sequence = sequenceFromState(
  typeof window === 'object' ? window.history.state : undefined
);

type Blocker = {
  readonly key: unknown;
  readonly message: string;
  readonly confirmNavigationHandler: typeof defaultConfirmNavigationHandler;
};
let unloadBlockers: Blocker[] = [];

let onBeforeUnloadHandler: (() => string) | undefined = undefined;

export function addUnloadProtect(
  key: unknown,
  message: string,
  confirmNavigationHandler = defaultConfirmNavigationHandler
): void {
  unloadBlockers.push({ key, message, confirmNavigationHandler });
  changeOnBeforeUnloadHandler(() => message);
}

function changeOnBeforeUnloadHandler(handler?: () => string): void {
  if (typeof onBeforeUnloadHandler === 'function')
    window.removeEventListener('onbeforeunload', onBeforeUnloadHandler);
  onBeforeUnloadHandler = handler;
  if (typeof handler === 'function')
    window.addEventListener('onbeforeunload', handler);
}

export function removeUnloadProtect(removalKey: unknown): void {
  unloadBlockers = unloadBlockers.filter(({ key }) => key !== removalKey);
  changeOnBeforeUnloadHandler(
    unloadBlockers.length === 0
      ? undefined
      : (): string => {
          const { message } = unloadBlockers[unloadBlockers.length - 1];
          return message;
        }
  );
}

export function clearUnloadProtect(): void {
  unloadBlockers = [];
  changeOnBeforeUnloadHandler(undefined);
}

/*
 * We are going to extend the window.history object to automatically
 * increment and store the sequence value on all pushState invocations.
 */

function getSequence() {
  return sequenceFromState(window.history.state);
}

const pushState: History['pushState'] = function (state: State, title, url) {
  sequence += 1;
  state.sequence = sequence;
  window.history.pushState(state, title, url);
};

const replaceState: History['replaceState'] = function (
  state: State,
  title,
  url
) {
  state.sequence = sequence;
  window.history.replaceState(state, title, url);
};

// @ts-expect-error
Backbone.history.history = Object.setPrototypeOf(
  {
    sequence: getSequence,
    pushState,
    replaceState,
  },
  typeof window === 'object' ? window.history : null!
);

/*
 * Make the Backbone routing mechanisms ignore queryparams in urls
 * this gets rid of all that *splat cruft in the routes.
 */
const loadUrl = Backbone.history.loadUrl;
Backbone.history.loadUrl = function (url: string | undefined) {
  const stripped = url && url.replace(/\?.*$/, '');
  return loadUrl.call(this, stripped);
};

/*
 * The Backbone history system binds checkUrl to the popstate
 * event. We replace it with a version that checks if unloadProtect is
 * set and optionally backs out the popstate in that case.
 */
const checkUrl = Backbone.history.checkUrl;
Backbone.history.checkUrl = function (event: any) {
  const poppedSequence = sequenceFromState(event.originalEvent.state);
  /*
   * If a popstate is canceled, we use window.history.go to return
   * to previous point in the history, which results another
   * popstate event where the sequence is the current sequence.
   */
  if (poppedSequence === sequence) return;

  // Handle the noop situation where the new URL is unchanged.
  const current = Backbone.history.getFragment();
  // @ts-expect-error
  if (current === Backbone.history.fragment) return;

  /*
   * This continuation "proceeds" to the popped history by updating
   * the current sequence and then invoking the default Backbone
   * popstate handler.
   */
  const proceed = (): void => {
    sequence = poppedSequence;
    checkUrl(event);
  };

  /*
   * This continuation "cancels" the popstate event by returning to
   * the point in history from whence it came. This will result in
   * another popstate event with the current sequence, which is
   * ignored above.
   */
  const cancel = (): void => window.history.go(sequence - poppedSequence);

  if (unloadBlockers.length > 0) confirmNavigation(proceed, cancel);
  else proceed();
};

/*
 * Open a dialog allowing the user to proceed with the navigation, or
 * remain on the same page. The proceed or cancel continuation will be
 * invoked accordingly. The unloadProtect variable will be cleared if
 * proceeding.
 */
function defaultConfirmNavigationHandler(
  proceed: () => void,
  cancel: () => void
): void {
  const { message } = unloadBlockers[unloadBlockers.length - 1];

  $(`<div role="alert">
        ${commonText('leavePageDialogHeader')}
        <p>${message}</p>
    </div>`).dialog({
    title: commonText('leavePageDialogTitle'),
    modal: true,
    width: 350,
    close() {
      $(this).remove();
    },
    buttons: {
      [commonText('cancel')]() {
        $(this).dialog('close');
        cancel?.();
      },
      [commonText('leave')]() {
        $(this).dialog('close');
        proceed();
      },
    },
  });
}

function confirmNavigation(proceed: () => void, cancel: () => void): void {
  const { confirmNavigationHandler } =
    unloadBlockers[unloadBlockers.length - 1];
  confirmNavigationHandler(proceed, cancel);
}

export function navigate(
  url: string,
  options:
    | boolean
    | {
        readonly trigger?: boolean;
        readonly replace?: boolean;
      }
): void {
  const cont = (): void => {
    clearUnloadProtect();

    if (isExternalUrl(url)) window.location.href = url;
    else {
      const origin =
        window.location.origin ||
        `${window.location.protocol}//${window.location.host}`;
      const strippedUrl = url
        .replace(new RegExp(`^${origin}`), '')
        .replace(/^\/specify/, '');
      Backbone.history.navigate(strippedUrl, options);
    }
  };

  if (unloadBlockers.length > 0)
    confirmNavigation(cont, () => {
      /* Nothing */
    });
  else cont();
}

export const start = (): void =>
  void Backbone.history.start({ pushState: true, root: '/specify/' });

export const go = (url: string): void => navigate(url, true);

export const push = (url: string): void =>
  navigate(url, { trigger: false, replace: true });

export function switchCollection(
  collection: number,
  nextUrl: string | undefined = undefined,
  cancelCallback: () => void = (): void => {
    /* Nothing */
  }
): void {
  const cont = (): void =>
    void ping('/context/collection/', {
      method: 'POST',
      body: collection.toString(),
    }).then(() => {
      if (typeof nextUrl === 'string') window.location.href = nextUrl;
      else window.location.reload();
    });
  if (unloadBlockers.length > 0) confirmNavigation(cont, cancelCallback);
  else cont();
}
