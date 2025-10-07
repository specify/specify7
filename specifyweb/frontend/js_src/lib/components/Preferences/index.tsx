/**
 * Edit user preferences
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
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
import { ProtectedTool } from '../Permissions/PermissionDenied';
import { PreferencesAside } from './Aside';
import type { BasePreferences } from './BasePreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { collectionPreferences } from './collectionPreferences';
import { useDarkMode } from './Hooks';
import { DefaultPreferenceItemRender } from './Renderers';
import type { GenericPreferences, PreferenceItem } from './types';
import { userPreferenceDefinitions } from './UserDefinitions';
import { userPreferences } from './userPreferences';
import { useTopChild } from './useTopChild';
import type { IR } from '../../utils/types';

const DOCS = {
  picklists:
    'https://discourse.specifysoftware.org/t/picklists-in-specify-7/2562',
  attachments:
    'https://discourse.specifysoftware.org/t/attachments-security-and-permissions/640',
  trees:
    'https://discourse.specifysoftware.org/t/enable-creating-children-for-synonymized-nodes/987/4',
  stats: 'https://discourse.specifysoftware.org/t/specify-7-statistics/1715',
  specifyNetwork:
    'https://discourse.specifysoftware.org/t/specify-network-gbif-integration/2793',
  catalogNumbers:
    'https://discourse.specifysoftware.org/t/catalog-number-inheritance/2859',
} as const;

export type PreferenceType = keyof typeof preferenceInstances;

const preferenceInstances: IR<BasePreferences<GenericPreferences>> = {
  user: userPreferences as unknown as BasePreferences<GenericPreferences>,
  collection: collectionPreferences as unknown as BasePreferences<GenericPreferences>,
};

const preferenceDefinitions: IR<GenericPreferences> = {
  user: userPreferenceDefinitions,
  collection: collectionPreferenceDefinitions,
};

const NAME_DOCS_MAP: Record<string, string> = {
  sp7_scope_table_picklists:
    'https://discourse.specifysoftware.org/t/picklists-in-specify-7/2562',
  'attachment.is_public_default':
    'https://discourse.specifysoftware.org/t/attachments-security-and-permissions/640',
  showPreparationsTotal:
    'https://discourse.specifysoftware.org/t/specify-7-statistics/1715',
  refreshRate:
    'https://discourse.specifysoftware.org/t/specify-7-statistics/1715',
  publishingOrganization:
    'https://discourse.specifysoftware.org/t/specify-network-gbif-integration/2793',
  collectionKey:
    'https://discourse.specifysoftware.org/t/specify-network-gbif-integration/2793',
};

const resolveCollectionDocumentHref = (
  category: string,
  _subcategory: string,
  name: string
): string | undefined => {
  if (NAME_DOCS_MAP[name]) return NAME_DOCS_MAP[name];
  if (name.startsWith('sp7.allow_adding_child_to_synonymized_parent.'))
    return 'https://discourse.specifysoftware.org/t/enable-creating-children-for-synonymized-nodes/987/4';
  if (category.startsWith('catalogNumber'))
    return 'https://discourse.specifysoftware.org/t/catalog-number-inheritance/2859';
  return undefined;
};

type DocHrefResolver =
  | ((category: string, subcategory: string, name: string) => string | undefined)
  | undefined;

const documentHrefResolvers: IR<DocHrefResolver> = {
  user: undefined,
  collection: resolveCollectionDocumentHref,
};

const collectionPreferencesPromise = Promise.all([
  collectionPreferences.fetch(),
]).then(f.true);

/**
 * Fetch app resource that stores current user preferences
 *
 * If app resource data with user preferences does not exist,
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
export function usePrefDefinitions(prefType: PreferenceType = 'user') {
  const isDarkMode = useDarkMode();
  const isRedirecting = React.useContext(userPreferences.Context) !== undefined;
  const userVisibilityContext = React.useMemo(
    () => ({
      isDarkMode,
      isRedirecting,
    }),
    [isDarkMode, isRedirecting]
  );

  const collectionVisibilityContext = React.useMemo(
    () => ({ isDarkMode: false, isRedirecting: false }),
    []
  );

  const visibilityContext =
    prefType === 'user' ? userVisibilityContext : collectionVisibilityContext;

  const definitions = preferenceDefinitions[prefType];

  return React.useMemo(
    () =>
      Object.entries(definitions)
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
                                ? visible(visibilityContext)
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
    [definitions, visibilityContext]
  );
}

export function PreferencesContent({
  forwardRefs,
  prefType = 'user',
}: {
  readonly forwardRefs?: (index: number, element: HTMLElement | null) => void;
  readonly prefType?: PreferenceType;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const definitions = usePrefDefinitions(prefType);
  const preferences = preferenceInstances[prefType];
  const resolveDocumentHref = documentHrefResolvers[prefType];
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
                              const definition = preferences.definition(
                                category as never,
                                subcategory as never,
                                name as never
                              );
                              preferences.set(
                                category as never,
                                subcategory as never,
                                name as never,
                                definition.defaultValue as never
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
                      const documentHref = resolveDocumentHref?.(
                        category,
                        subcategory,
                        name
                      );
                      const stackDocumentation =
                        prefType === 'collection' && documentHref !== undefined;
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
                            {(item.description !== undefined ||
                              documentHref !== undefined) && (
                              <p
                                className={
                                  stackDocumentation
                                    ? 'flex flex-1 flex-col items-end gap-1 text-gray-500 md:text-right'
                                    : 'flex flex-1 justify-end text-gray-500 md:text-right'
                                }
                              >
                                {item.description !== undefined && (
                                  <FormatString
                                    text={
                                      typeof item.description === 'function'
                                        ? item.description()
                                        : item.description
                                    }
                                  />
                                )}
                                {documentHref !== undefined && (
                                  <Link.NewTab
                                    className={
                                      stackDocumentation
                                        ? 'self-end'
                                        : undefined
                                    }
                                    href={documentHref}
                                  >
                                    {headerText.documentation()}
                                  </Link.NewTab>
                                )}
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
                                preferences={preferences}
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
  preferences,
}: {
  readonly item: PreferenceItem<any>;
  readonly category: string;
  readonly subcategory: string;
  readonly name: string;
  readonly preferences: BasePreferences<GenericPreferences>;
}): JSX.Element {
  const Renderer =
    'renderer' in item ? item.renderer : DefaultPreferenceItemRender;
  const [value, setValue] = preferences.use(
    category as never,
    subcategory as never,
    name as never
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

function CollectionPreferences(): JSX.Element {
  return (
    <ProtectedTool action="update" tool="resources">
      <div className="relative flex flex-col gap-6 overflow-y-auto">
        <PreferencesContent prefType="collection" />
      </div>
    </ProtectedTool>
  );
}

export function CollectionPreferencesWrapper(): JSX.Element | null {
  const [hasFetched] = usePromise(collectionPreferencesPromise, true);
  return hasFetched === true ? <CollectionPreferences /> : null;
}
