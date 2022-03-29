import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import { csrfToken } from '../csrftoken';
import commonText from '../localization/common';
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
import { useTitle } from './hooks';
import { parseDjangoDump, SplashScreen } from './splashscreen';
import { Contexts } from './contexts';
import { f } from '../functools';

// TODO: remove collections you don't have permission to from the list
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

  return (
    <SplashScreen>
      <Form method="post">
        <h2>{commonText('chooseCollection')}</h2>
        {data.errors.length > 0 && <ErrorMessage>{data.errors}</ErrorMessage>}
        {data.availableCollections.length === 0 ? (
          <ErrorMessage>
            {commonText('noAccessToCollections')((label: string) => (
              <Link.Default href={`/accounts/login/?next=${data.nextUrl}`}>
                {label}
              </Link.Default>
            ))}
          </ErrorMessage>
        ) : (
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
        )}
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={csrfToken ?? ''}
        />
        <input type="hidden" name="next" value={nextUrl} />
        <Submit.Fancy forwardRef={submitRef}>{commonText('open')}</Submit.Fancy>
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
            ].filter(Boolean),
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
