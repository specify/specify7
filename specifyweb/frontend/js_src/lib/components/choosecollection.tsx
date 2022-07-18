/**
 * The entrypoint for the choose collection endpoint
 */

import '../../css/main.css';

import React from 'react';

import { ping } from '../ajax';
import { csrfToken, parseDjangoDump } from '../csrftoken';
import type { Collection } from '../datamodel';
import type { SerializedModel } from '../datamodelutils';
import { f } from '../functools';
import { sortFunction, toLowerCase } from '../helpers';
import { commonText } from '../localization/common';
import { formatUrl } from '../querystring';
import { scrollIntoView } from '../treeviewutils';
import type { RA } from '../types';
import { Button, ErrorMessage, Form, Input, Label, Submit } from './basic';
import { LoadingContext } from './contexts';
import { useTitle } from './hooks';
import { usePref } from './preferenceshooks';
import { entrypoint, SplashScreen } from './splashscreen';

function ChooseCollection({
  data,
  nextUrl,
}: {
  readonly data: {
    readonly errors: RA<string>;
    readonly availableCollections: RA<SerializedModel<Collection>>;
    readonly initialValue: string | null;
    readonly nextUrl: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  useTitle(commonText('chooseCollection'));

  // Focus submit button if some collection is selected by default
  const submitRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(
    () =>
      typeof data.initialValue === 'string'
        ? void submitRef.current?.focus()
        : undefined,
    [data.initialValue]
  );

  const [sortOrder] = usePref('chooseCollection', 'general', 'sortOrder');
  const isReverseSort = sortOrder.startsWith('-');
  const sortField = (isReverseSort ? sortOrder.slice(1) : sortOrder) as string &
    keyof Collection['fields'];
  const availableCollections = React.useMemo(
    () =>
      Array.from(data.availableCollections).sort(
        sortFunction(
          (collection) => collection[toLowerCase(sortField)],
          isReverseSort
        )
      ),
    [data.availableCollections, isReverseSort, sortField]
  );

  const [selectedCollection, setSelectedCollection] = React.useState<
    number | undefined
  >(() =>
    /*
     * When switching databases on the test server, initial value may point
     * to a collection that doesn't exist in this database
     */
    f.maybe(f.parseInt(data.initialValue ?? ''), (id) =>
      data.availableCollections.some((collection) => collection.id === id)
        ? id
        : undefined
    )
  );

  /*
   * If there is a remotepref to not ask for collection every time,
   * submit the form as soon as loaded
   */
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [alwaysPrompt] = usePref('chooseCollection', 'general', 'alwaysPrompt');
  React.useEffect(() => {
    if (f.parseInt(data.initialValue ?? '') === undefined) return;
    else if (!alwaysPrompt || availableCollections.length === 1)
      formRef.current?.submit();
    else
      f.maybe(
        /*
         * Scroll to selected option automatically (useful if not all collection
         * fit on the screen at once and there is a scroll bar
         */
        (formRef.current?.querySelector('input:checked') as
          | HTMLElement
          | undefined) ?? undefined,
        scrollIntoView
      );
  }, [alwaysPrompt, data.initialValue, availableCollections]);

  const hasAccess = availableCollections.length > 0;
  const loading = React.useContext(LoadingContext);
  return (
    <SplashScreen>
      <Form method="post" forwardRef={formRef}>
        <h2>{commonText('chooseCollection')}:</h2>
        {data.errors.length > 0 && <ErrorMessage>{data.errors}</ErrorMessage>}
        {hasAccess ? (
          <>
            <div className="-ml-1 flex max-h-56 flex-col gap-2 overflow-y-auto pl-1">
              {availableCollections.map(({ id, collectionname }) => (
                <Label.ForCheckbox key={id}>
                  <Input.Radio
                    name="collection"
                    value={id}
                    checked={selectedCollection === id}
                    onChange={(): void => setSelectedCollection(id)}
                    required
                  />
                  {collectionname}
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
            <Button.Fancy
              onClick={(): void =>
                loading(
                  ping('/accounts/logout').then(() =>
                    globalThis.location.assign(
                      formatUrl('/accounts/logout/', { next: data.nextUrl })
                    )
                  )
                )
              }
            >
              {commonText('login')}
            </Button.Fancy>
          </>
        )}
      </Form>
    </SplashScreen>
  );
}

entrypoint('chooseCollection', () => (
  <ChooseCollection
    data={{
      errors: [
        parseDjangoDump<string>('form-errors'),
        parseDjangoDump<string>('collection-errors'),
      ]
        .flat()
        .filter(Boolean),
      availableCollections: JSON.parse(
        parseDjangoDump('available-collections')
      ),
      // REFACTOR: store this on the front-end?
      initialValue: parseDjangoDump('initial-value'),
      nextUrl: parseDjangoDump('next-url'),
    }}
    nextUrl={parseDjangoDump<string>('next-url') ?? '/specify/'}
  />
));
