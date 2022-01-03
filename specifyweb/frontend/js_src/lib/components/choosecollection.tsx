import '../../css/main.css';

import React from 'react';
import ReactDOM from 'react-dom';

import csrfToken from '../csrftoken';
import commonText from '../localization/common';
import type { RA } from '../types';
import {
  CheckboxGroup,
  className,
  ErrorMessage,
  FancySubmit,
  Form,
  LabelForCheckbox,
  Radio,
} from './basic';
import ErrorBoundary from './errorboundary';
import { useTitle } from './hooks';
import { parseDjangoDump, SplashScreen } from './splashscreen';

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
  >(
    typeof data.initialValue === 'string'
      ? Number.parseInt(data.initialValue)
      : undefined
  );

  return (
    <SplashScreen>
      <Form method="post">
        <h2>{commonText('chooseCollection')}</h2>
        {data.errors.length > 0 && <ErrorMessage>{data.errors}</ErrorMessage>}
        {data.availableCollections.length === 0 ? (
          <ErrorMessage>
            {commonText('noAccessToCollections')((label: string) => (
              <a href={`/accounts/login/?next=${data.nextUrl}`}>{label}</a>
            ))}
          </ErrorMessage>
        ) : (
          <CheckboxGroup>
            {data.availableCollections.map(([id, label]) => (
              <LabelForCheckbox key={id}>
                <Radio
                  name="collection"
                  value={id}
                  checked={selectedCollection === id}
                  onChange={(): void => setSelectedCollection(id)}
                />
                {label}
              </LabelForCheckbox>
            ))}
          </CheckboxGroup>
        )}
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={csrfToken ?? ''}
        />
        <input type="hidden" name="next" value={nextUrl} />
        <FancySubmit value={commonText('open')} />
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
      <ErrorBoundary>
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
      </ErrorBoundary>
    </React.StrictMode>,
    root
  );
});
