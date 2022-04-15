/**
 * The entrypoint for the choose collection endpoint
 */

import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { csrfToken } from '../csrftoken';
import { f } from '../functools';
import { commonText } from '../localization/common';
import { fetchContext as fetchRemotePrefs, getPref } from '../remoteprefs';
import type { RA } from '../types';
import {
  className,
  ErrorMessage,
  Form,
  Input,
  Label,
  Link,
  Submit,
} from './basic';
import { Contexts } from './contexts';
import { useAsyncState, useTitle } from './hooks';
import { parseDjangoDump, SplashScreen } from './splashscreen';
import { unlockInitialContext } from '../initialcontext';

unlockInitialContext('chooseCollection');

function ChooseCollection({
  data,
  nextUrl,
}: {
  readonly data: {
    readonly errors: RA<string>;
    readonly availableCollections: RA<Readonly<[number, string]>>;
    readonly initialValue: string | null;
    readonly nextUrl: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  useTitle(commonText('chooseCollection'));
  const [selectedCollection, setSelectedCollection] = React.useState<
    number | undefined
  >(f.parseInt(data.initialValue ?? ''));

  // Focus submit button if some collection is selected by default
  const submitRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(
    () =>
      typeof data.initialValue === 'string'
        ? void submitRef.current?.focus()
        : undefined,
    [data.initialValue]
  );

  const [remotePrefsFetched] = useAsyncState(
    React.useCallback(async () => fetchRemotePrefs.then(f.true), []),
    false
  );

  /*
   * If there is a remotepref to not ask for collection every time,
   * submit the form as soon as loaded
   */
  const formRef = React.useRef<HTMLFormElement | null>(null);
  React.useEffect(
    () =>
      remotePrefsFetched &&
      !getPref('ALWAYS.ASK.COLL') &&
      typeof f.parseInt(data.initialValue ?? '') === 'number'
        ? formRef.current?.submit()
        : undefined,
    [remotePrefsFetched, data.initialValue]
  );

  const hasAccess = data.availableCollections.length > 0;
  return (
    <SplashScreen>
      <Form method="post" forwardRef={formRef}>
        <h2>{commonText('chooseCollection')}</h2>
        {data.errors.length > 0 && <ErrorMessage>{data.errors}</ErrorMessage>}
        {hasAccess ? (
          <>
            <div className="max-h-56 flex flex-col gap-2 pl-1 -ml-1 overflow-y-auto">
              {data.availableCollections.map(([id, label]) => (
                <Label.ForCheckbox key={id}>
                  <Input.Radio
                    name="collection"
                    value={id}
                    checked={selectedCollection === id}
                    onChange={(): void => setSelectedCollection(id)}
                  />
                  {label}
                </Label.ForCheckbox>
              ))}
            </div>
            <input
              type="hidden"
              name="csrfmiddlewaretoken"
              value={csrfToken ?? ''}
            />
            <input type="hidden" name="next" value={nextUrl} />
            <Submit.Fancy forwardRef={submitRef}>
              {commonText('open')}
            </Submit.Fancy>
          </>
        ) : (
          <>
            <ErrorMessage>
              <span>{commonText('noAccessToCollections')}</span>
            </ErrorMessage>
            <Link.LikeFancyButton
              className={className.fancyButton}
              href={`/accounts/login/?next=${data.nextUrl}`}
            >
              {commonText('login')}
            </Link.LikeFancyButton>
          </>
        )}
      </Form>
    </SplashScreen>
  );
}

window.addEventListener('load', () => {
  const root = document.getElementById('root');
  if (root === null) throw new Error('Unable to find root element');
  root.setAttribute('class', className.root);
  ReactDOM.render(
    <React.StrictMode>
      <Contexts>
        <ChooseCollection
          data={{
            errors: [
              parseDjangoDump<string>('form-errors'),
              parseDjangoDump<string>('collection-errors'),
            ]
              .flat()
              .filter(Boolean),
            availableCollections: parseDjangoDump('available-collections'),
            initialValue: parseDjangoDump('initial-value'),
            nextUrl: parseDjangoDump('next-url'),
          }}
          nextUrl={parseDjangoDump<string>('next-url') ?? '/specify/'}
        />
      </Contexts>
    </React.StrictMode>,
    root
  );
});
