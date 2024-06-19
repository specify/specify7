/**
 * Edit user preferences
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { StringToJsx } from '../../localization/utils';
import { f } from '../../utils/functools';
import { Container, H2, Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasPermission } from '../Permissions/helpers';
import { PreferencesAside } from './Aside';
import { collectionPreferences } from './collectionPreferences';
import { useDarkMode } from './Hooks';
import { DefaultPreferenceItemRender } from './Renderers';
import type { GenericPreferences, PreferenceItem } from './types';
import { userPreferenceDefinitions } from './UserDefinitions';
import { userPreferences } from './userPreferences';
import { useTopChild } from './useTopChild';

/**
 * Fetch app resource that stores current user preferences
 *
 * If app resource data with user preferences does not exists does not exist,
 * check if SpAppResourceDir and SpAppResource exist and create them if needed,
 * then, create the app resource data itself
 */
const preferencesPromise = Promise.all([
  userPreferences.fetch(),
  collectionPreferences.fetch(),
]).then(f.true);

function Preferences(): JSX.Element {
  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  React.useEffect(
    () =>
      userPreferences.events.on('update', (payload) => {
        if (payload?.definition?.requiresReload === true) handleRestartNeeded();
        handleChangesMade();
      }),
    [handleChangesMade, handleRestartNeeded]
  );

  const {
    visibleChild,
    forwardRefs,
    scrollContainerRef,
    setVisibleChild,
    references,
  } = useTopChild();

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{preferencesText.preferences()}</H2>
      <Form
        className="contents"
        onSubmit={(): void =>
          loading(
            userPreferences
              .awaitSynced()
              .then(() =>
                needsRestart
                  ? globalThis.location.assign('/specify/')
                  : navigate('/specify/')
              )
          )
        }
      >
        <div
          className="relative flex flex-col gap-6 overflow-y-auto md:flex-row"
          ref={scrollContainerRef}
        >
          <PreferencesAside
            activeCategory={visibleChild}
            references={references}
            setActiveCategory={setVisibleChild}
          />
          <PreferencesContent forwardRefs={forwardRefs} />
          <span className="flex-1" />
        </div>
        <div className="flex justify-end">
          {changesMade ? (
            <Submit.Save>{commonText.save()}</Submit.Save>
          ) : (
            <Link.Secondary href="/specify/">
              {commonText.close()}
            </Link.Secondary>
          )}
        </div>
      </Form>
    </Container.FullGray>
  );
}

/** Hide invisible preferences. Remote empty categories and subCategories */
export function usePrefDefinitions() {
  const isDarkMode = useDarkMode();
  const isRedirecting = React.useContext(userPreferences.Context) !== undefined;
  const preferencesVisibilityContext = React.useMemo(
    () => ({
      isDarkMode,
      isRedirecting,
    }),
    [isDarkMode, isRedirecting]
  );

  return React.useMemo(
    () =>
      Object.entries(userPreferenceDefinitions as GenericPreferences)
        .map(
          ([category, { subCategories, ...categoryData }]) =>
            [
              category,
              {
                ...categoryData,
                subCategories: Object.entries(subCategories)
                  .map(
                    ([subCategory, { items, ...subCategoryData }]) =>
                      [
                        subCategory,
                        {
                          ...subCategoryData,
                          items: Object.entries(items).filter(
                            ([_name, { visible }]) =>
                              typeof visible === 'function'
                                ? visible(preferencesVisibilityContext)
                                : visible !== false
                          ),
                        },
                      ] as const
                  )
                  .filter(([_name, { items }]) => items.length > 0),
              },
            ] as const
        )
        .filter(([_name, { subCategories }]) => subCategories.length > 0),
    [preferencesVisibilityContext]
  );
}

export function PreferencesContent({
  forwardRefs,
}: {
  readonly forwardRefs?: (index: number, element: HTMLElement | null) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const definitions = usePrefDefinitions();
  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(
        (
          [category, { title, description = undefined, subCategories }],
          index
        ) => (
          <ErrorBoundary dismissible key={category}>
            <Container.Center
              className="gap-8 overflow-y-visible"
              forwardRef={forwardRefs?.bind(undefined, index)}
              id={category}
            >
              <h3 className="text-2xl">
                {typeof title === 'function' ? title() : title}
              </h3>
              {description !== undefined && (
                <p>
                  {typeof description === 'function'
                    ? description()
                    : description}
                </p>
              )}
              {subCategories.map(
                ([subcategory, { title, description = undefined, items }]) => (
                  <section
                    className="flex flex-col items-start gap-4 md:items-stretch"
                    key={subcategory}
                  >
                    <div className="flex items-center gap-2">
                      <h4
                        className={`${className.headerGray} text-xl md:text-center`}
                      >
                        {typeof title === 'function' ? title() : title}
                      </h4>
                      <div className="flex flex-1 justify-end">
                        <Button.Small
                          onClick={(): void =>
                            items.forEach(([name]) => {
                              userPreferences.set(
                                category as 'general',
                                subcategory as 'ui',
                                name as 'theme',
                                /*
                                 * Need to get default value via this
                                 * function as defaults may be changed
                                 */
                                userPreferences.definition(
                                  category as 'general',
                                  subcategory as 'ui',
                                  name as 'theme'
                                ).defaultValue
                              );
                            })
                          }
                        >
                          {commonText.reset()}
                        </Button.Small>
                      </div>
                    </div>
                    {description !== undefined && (
                      <p>
                        {typeof description === 'function'
                          ? description()
                          : description}
                      </p>
                    )}
                    {items.map(([name, item]) => {
                      const canEdit =
                        !isReadOnly &&
                        (item.visible !== 'protected' ||
                          hasPermission('/preferences/user', 'edit_protected'));
                      const props = {
                        className: `
                            flex items-start gap-2 md:flex-row flex-col
                            ${canEdit ? '' : '!cursor-not-allowed'}
                          `,
                        key: name,
                        title: canEdit
                          ? undefined
                          : preferencesText.adminsOnlyPreference(),
                      };
                      const children = (
                        <>
                          <div className="flex flex-col items-start gap-2 md:flex-1 md:items-stretch">
                            <p
                              className={`
                                flex min-h-[theme(spacing.8)] flex-1 items-center
                                justify-end md:text-right
                              `}
                            >
                              <FormatString
                                text={
                                  typeof item.title === 'function'
                                    ? item.title()
                                    : item.title
                                }
                              />
                            </p>
                            {item.description !== undefined && (
                              <p className="flex flex-1 justify-end text-gray-500 md:text-right">
                                <FormatString
                                  text={
                                    typeof item.description === 'function'
                                      ? item.description()
                                      : item.description
                                  }
                                />
                              </p>
                            )}
                          </div>
                          <div
                            className={`
                              flex min-h-[theme(spacing.8)] flex-1 flex-col justify-center
                              gap-2
                            `}
                          >
                            <ReadOnlyContext.Provider value={!canEdit}>
                              <Item
                                category={category}
                                item={item}
                                name={name}
                                subcategory={subcategory}
                              />
                            </ReadOnlyContext.Provider>
                          </div>
                        </>
                      );
                      return 'container' in item && item.container === 'div' ? (
                        <div {...props}>{children}</div>
                      ) : (
                        <label {...props}>{children}</label>
                      );
                    })}
                  </section>
                )
              )}
            </Container.Center>
          </ErrorBoundary>
        )
      )}
    </div>
  );
}

function FormatString({
  text,
}: {
  readonly text: JSX.Element | LocalizedString;
}): JSX.Element {
  return typeof text === 'object' ? (
    text
  ) : text.includes('<key>') ? (
    <span>
      <StringToJsx
        components={{
          key: (key) => <Key>{key}</Key>,
        }}
        string={text}
      />
    </span>
  ) : (
    <>{text}</>
  );
}

function Item({
  item,
  category,
  subcategory,
  name,
}: {
  readonly item: PreferenceItem<any>;
  readonly category: string;
  readonly subcategory: string;
  readonly name: string;
}): JSX.Element {
  const Renderer =
    'renderer' in item ? item.renderer : DefaultPreferenceItemRender;
  const [value, setValue] = userPreferences.use(
    // Asserting types just to simplify typing
    category as 'general',
    subcategory as 'ui',
    name as 'theme'
  );
  const children = (
    <Renderer
      category={category}
      definition={item}
      item={name}
      subcategory={subcategory}
      value={value}
      onChange={setValue}
    />
  );
  return 'renderer' in item ? (
    <ErrorBoundary dismissible>{children}</ErrorBoundary>
  ) : (
    children
  );
}

export function PreferencesWrapper(): JSX.Element | null {
  const [hasFetched] = usePromise(preferencesPromise, true);
  return hasFetched === true ? <Preferences /> : null;
}
