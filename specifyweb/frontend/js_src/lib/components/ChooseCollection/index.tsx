/**
 * The entrypoint for the choose collection endpoint
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { csrfToken, parseDjangoDump } from '../../utils/ajax/csrfToken';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { sortFunction, toLowerCase } from '../../utils/utils';
import { ErrorMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { SplashScreen } from '../Core/SplashScreen';
import type { SerializedModel } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/types';
import { toLargeSortConfig } from '../Molecules/Sorting';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { scrollIntoView } from '../TreeView/helpers';

export function ChooseCollection(): JSX.Element {
  return React.useMemo(
    () => (
      <Wrapped
        errors={[
          parseDjangoDump<string>('form-errors') ?? [],
          parseDjangoDump<string>('collection-errors') ?? [],
        ]
          .flat()
          .filter(Boolean)}
        availableCollections={JSON.parse(
          parseDjangoDump('available-collections') ?? '[]'
        )}
        // REFACTOR: store this on the front-end?
        initialValue={parseDjangoDump('initial-value') ?? null}
        nextUrl={parseDjangoDump<string>('next-url') ?? '/specify/'}
      />
    ),
    []
  );
}

function Wrapped({
  errors,
  availableCollections,
  initialValue,
  nextUrl,
}: {
  readonly errors: RA<string>;
  readonly availableCollections: RA<SerializedModel<Collection>>;
  readonly initialValue: string | null;
  readonly nextUrl: string;
}): JSX.Element {
  // Focus submit button if some collection is selected by default
  const submitRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(
    () =>
      typeof initialValue === 'string' ? submitRef.current?.focus() : undefined,
    [initialValue]
  );

  const [sortOrder] = userPreferences.use(
    'chooseCollection',
    'general',
    'sortOrder'
  );
  const sortedCollections = React.useMemo(() => {
    const { fieldNames, direction } = toLargeSortConfig(sortOrder);
    return Array.from(availableCollections).sort(
      sortFunction(
        // FEATURE: support sorting by related model
        (collection) =>
          collection[
            toLowerCase(fieldNames.join('.') as keyof Collection['fields'])
          ],
        direction === 'desc'
      )
    );
  }, [availableCollections, sortOrder]);

  const [selectedCollection, setSelectedCollection] = React.useState<
    number | undefined
  >(() => {
    const id = f.parseInt(initialValue ?? '');
    /*
     * When switching databases on the test server, initial value may point
     * to a collection that doesn't exist in this database
     */
    return availableCollections.some((collection) => collection.id === id)
      ? id
      : undefined;
  });

  /*
   * If there is a remotepref to not ask for collection every time,
   * submit the form as soon as loaded
   */
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [alwaysPrompt] = userPreferences.use(
    'chooseCollection',
    'general',
    'alwaysPrompt'
  );
  React.useEffect(() => {
    if (f.parseInt(initialValue ?? '') === undefined) return;
    else if (!alwaysPrompt || sortedCollections.length === 1)
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
  }, [alwaysPrompt, initialValue, sortedCollections]);

  const hasAccess = sortedCollections.length > 0;
  const loading = React.useContext(LoadingContext);
  return (
    <SplashScreen>
      <Form forwardRef={formRef} method="post">
        <h2>{commonText.chooseCollection()}:</h2>
        {errors.length > 0 && <ErrorMessage>{errors}</ErrorMessage>}
        {hasAccess ? (
          <>
            <div className="-ml-1 flex max-h-[50vh] flex-col gap-2 overflow-y-auto pl-1">
              {sortedCollections.map(({ id, collectionname }) => (
                <Label.Inline key={id}>
                  <Input.Radio
                    checked={selectedCollection === id}
                    name="collection"
                    required
                    value={id}
                    onChange={(): void => setSelectedCollection(id)}
                  />
                  {collectionname}
                </Label.Inline>
              ))}
            </div>
            <input
              name="csrfmiddlewaretoken"
              type="hidden"
              value={csrfToken ?? ''}
            />
            <input name="next" type="hidden" value={nextUrl} />
            <Submit.Fancy forwardRef={submitRef}>
              {commonText.open()}
            </Submit.Fancy>
          </>
        ) : (
          <>
            <ErrorMessage>
              <span>{userText.noAccessToCollections()}</span>
            </ErrorMessage>
            <Button.Fancy
              onClick={(): void =>
                loading(
                  ping('/accounts/logout/').then(() =>
                    globalThis.location.assign(
                      formatUrl('/accounts/logout/', { next: nextUrl })
                    )
                  )
                )
              }
            >
              {userText.logIn()}
            </Button.Fancy>
          </>
        )}
      </Form>
    </SplashScreen>
  );
}
