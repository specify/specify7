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
import { statsText } from '../../localization/stats';
import { treeText } from '../../localization/tree';
import { StringToJsx } from '../../localization/utils';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
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

export type PreferenceType = keyof typeof preferenceInstances;

const preferenceInstances: IR<BasePreferences<any>> = {
  user: userPreferences,
  collection: collectionPreferences,
};

const preferenceDefinitions: IR<GenericPreferences> = {
  user: userPreferenceDefinitions,
  collection: collectionPreferenceDefinitions,
};

type SubcategoryDocumentation = {
  readonly href: string;
  readonly label: LocalizedString | (() => LocalizedString);
};

const SUBCATEGORY_DOCS_MAP: Record<string, Record<string, SubcategoryDocumentation>> = {
  treeManagement: {
    synonymized: {
      href: 'https://discourse.specifysoftware.org/t/enable-creating-children-for-synonymized-nodes/987/4',
      label: headerText.documentation,
    },
  },
  statistics: {
    appearance: {
      href: 'https://discourse.specifysoftware.org/t/specify-7-statistics/1715',
      label: headerText.documentation,
    },
  },
};

type DocumentHrefResolver =
  | ((
    category: string,
    subcategory: string,
    name: string
  ) => string | undefined)
  | undefined;

const documentHrefResolvers: IR<DocumentHrefResolver> = {
  user: undefined,
  collection: undefined,
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

  const visibilityContext = React.useMemo(
    () =>
      prefType === 'user'
        ? { isDarkMode, isRedirecting }
        : { isDarkMode: false, isRedirecting: false },
    [prefType, isDarkMode, isRedirecting]
  );

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
  const definitionsMap = React.useMemo(
    () => new Map(definitions),
    [definitions]
  );

  const renderSubCategory = React.useCallback(
    (
      categoryKey: string,
      subcategoryKey: string,
      {
        title,
        description = undefined,
        items,
      }: {
        readonly title: LocalizedString | (() => LocalizedString);
        readonly description?: LocalizedString | (() => LocalizedString);
        readonly items: readonly (readonly [string, PreferenceItem<any>])[];
      },
      options: { readonly hideTitle?: boolean } = {}
    ): JSX.Element => {
      const subcategoryDoc =
        SUBCATEGORY_DOCS_MAP[categoryKey]?.[subcategoryKey];
      const { hideTitle = false } = options;

      return (
        <section
          className="flex flex-col items-start gap-4 md:items-stretch"
          key={`${categoryKey}-${subcategoryKey}`}
        >
          <div className="flex items-center gap-2">
            <h4
              aria-hidden={hideTitle === true}
              className={`${className.headerGray} text-xl md:text-center ${
                hideTitle === true ? 'invisible' : ''
              }`}
            >
              {typeof title === 'function' ? title() : title}
            </h4>
            <div className="flex flex-1 justify-end">
              <Button.Small
                onClick={(): void =>
                  items.forEach(([name]) => {
                    const definition = preferences.definition(
                      categoryKey as never,
                      subcategoryKey as never,
                      name as never
                    );
                    preferences.set(
                      categoryKey as never,
                      subcategoryKey as never,
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
          {subcategoryDoc !== undefined && (
            <p className="text-gray-500">
              <Link.NewTab href={subcategoryDoc.href}>
                <FormatString
                  text={
                    typeof subcategoryDoc.label === 'function'
                      ? subcategoryDoc.label()
                      : subcategoryDoc.label
                  }
                />
              </Link.NewTab>
            </p>
          )}
          {description !== undefined && (
            <p>
              {typeof description === 'function' ? description() : description}
            </p>
          )}
        {items.map(([name, item]) => {
          const canEdit =
            !isReadOnly &&
            (item.visible !== 'protected' ||
              hasPermission('/preferences/user', 'edit_protected'));
          const documentHref = resolveDocumentHref?.(
            categoryKey,
            subcategoryKey,
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
            title: canEdit ? undefined : preferencesText.adminsOnlyPreference(),
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
                      className={`flex flex-1 text-gray-500 md:text-right ${
                        stackDocumentation ? 'flex-col items-end gap-1' : 'justify-end'
                      }`}
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
                          className={stackDocumentation ? 'self-end' : undefined}
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
                    category={categoryKey}
                    item={item}
                    name={name}
                    preferences={preferences}
                    subcategory={subcategoryKey}
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
      );
    },
    [
      isReadOnly,
      prefType,
      preferences,
      resolveDocumentHref,
    ]
  );

  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(
        (
          [category, { title, description = undefined, subCategories }],
          index
        ) => {
          if (prefType === 'collection' && category === 'catalogNumberParentInheritance')
            return null;

          const isCatalogInheritance =
            prefType === 'collection' && category === 'catalogNumberInheritance';
          const parentDefinition = isCatalogInheritance
            ? definitionsMap.get('catalogNumberParentInheritance') ?? undefined
            : undefined;

          return (
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
                {subCategories.map(([subcategory, data]) =>
                  renderSubCategory(category, subcategory, data)
                )}
                {isCatalogInheritance &&
                  parentDefinition?.subCategories.map(([subcategory, data]) =>
                    renderSubCategory(
                      'catalogNumberParentInheritance',
                      subcategory,
                      data,
                      { hideTitle: true }
                    )
                  )}
              </Container.Center>
            </ErrorBoundary>
          );
        }
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

function CollectionPreferences(): JSX.Element {
  return (
    <ProtectedTool action="update" tool="resources">
      <div className="relative flex flex-col gap-6 overflow-y-auto">
        <PreferencesContent prefType="collection" />
      </div>
    </ProtectedTool>
  );
}

function FetchGate({
  promise,
  children,
}: {
  readonly promise: Promise<unknown>;
  readonly children?: React.ReactNode;
}): JSX.Element | null {
  const [hasFetched] = usePromise(promise, true);
  return hasFetched ? <>{children}</> : null;
}

export function PreferencesWrapper(): JSX.Element | null {
  return (
    <FetchGate promise={preferencesPromise}>
      <Preferences />
    </FetchGate>
  );
}

export function CollectionPreferencesWrapper(): JSX.Element | null {
  return (
    <FetchGate promise={collectionPreferencesPromise}>
      <CollectionPreferences />
    </FetchGate>
  );
}
