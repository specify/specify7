import React from 'react';
import { useNavigate } from 'react-router-dom';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { ProtectedTool } from '../Permissions/PermissionDenied';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { fetchContext as fetchRemotePrefs, getCollectionPref, getPref } from '../InitialContext/remotePrefs';
import { schema } from '../DataModel/schema';
import { collectionPreferences } from './collectionPreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { DefaultPreferenceItemRender } from './Renderers';
import type { GenericPreferences } from './types';
import { BasePreferences } from './BasePreferences';
import { useTopChild } from './useTopChild';

const preferencesPromise = collectionPreferences.fetch().then(() => true);

type CollectionPreferencesInstance = BasePreferences<typeof collectionPreferenceDefinitions>;
type ItemEntry = ReturnType<typeof useCollectionPrefDefinitions>[number][1]['subCategories'][number][1]['items'][number];

function useCollectionPrefDefinitions() {
  const visibilityContext = React.useMemo(
    () => ({ isDarkMode: false, isRedirecting: false }),
    []
  );
  return React.useMemo(() =>
    Object.entries(collectionPreferenceDefinitions as GenericPreferences)
      .map(([category, { subCategories, ...categoryData }]) => [
        category,
        {
          ...categoryData,
          subCategories: Object.entries(subCategories)
            .map(([subcategory, { items, ...subcategoryData }]) => [
              subcategory,
              {
                ...subcategoryData,
                items: Object.entries(items).filter(([, item]) =>
                  typeof item.visible === 'function'
                    ? item.visible(visibilityContext)
                    : item.visible !== false
                ),
              },
            ] as const)
            .filter(([, { items }]) => items.length > 0),
        },
      ] as const)
      .filter(([, { subCategories }]) => subCategories.length > 0),
  [visibilityContext]);
}

function CollectionPreferencesAside({
  definitions,
  activeCategory,
  setActiveCategory,
  references,
}: {
  readonly definitions: ReturnType<typeof useCollectionPrefDefinitions>;
  readonly activeCategory: number | undefined;
  readonly setActiveCategory: (index: number | undefined) => void;
  readonly references: ReturnType<typeof useTopChild>['references'];
}): JSX.Element {
  return (
    <aside
      className="top-0 flex min-w-fit flex-shrink-0 flex-col divide-y-4 divide-[color:var(--form-background)] overflow-y-auto md:sticky md:flex-1"
    >
      {definitions.map(([category, { title }], index) => (
        <Link.Secondary
          aria-current={activeCategory === index ? 'page' : undefined}
          href={`#${category}`}
          key={category}
          onClick={(event): void => {
            event.preventDefault();
            setActiveCategory(index);
            const element = references.current?.[index];
            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          {typeof title === 'function' ? title() : title}
        </Link.Secondary>
      ))}
    </aside>
  );
}

function CollectionPreferencesContent({
  definitions,
  preferences,
  forwardRefs,
}: {
  readonly definitions: ReturnType<typeof useCollectionPrefDefinitions>;
  readonly preferences: CollectionPreferencesInstance;
  readonly forwardRefs?: (index: number, element: HTMLElement | null) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);

  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(([category, { title, description, subCategories }], index) => (
        <ErrorBoundary dismissible key={category}>
          <Container.Center
            className="gap-8 overflow-y-visible"
            forwardRef={forwardRefs?.bind(undefined, index)}
            id={category}
          >
            <h3 className="text-2xl">{typeof title === 'function' ? title() : title}</h3>
            {description !== undefined && (
              <p>
                {typeof description === 'function' ? description() : description}
              </p>
            )}
            {subCategories.map(([subcategory, { title: subTitle, description: subDescription, items }]) => (
              <section className="flex flex-col items-start gap-4 md:items-stretch" key={subcategory}>
                <div className="flex items-center gap-2">
                  <h4 className={`${className.headerGray} text-xl md:text-center`}>
                    {typeof subTitle === 'function' ? subTitle() : subTitle}
                  </h4>
                  <div className="flex flex-1 justify-end">
                    <Button.Small
                      disabled={isReadOnly}
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
                {subDescription !== undefined && (
                  <p>
                    {typeof subDescription === 'function'
                      ? subDescription()
                      : subDescription}
                  </p>
                )}
                {items.map((itemEntry) => (
                  <CollectionPreferenceItem
                    category={category}
                    isReadOnly={isReadOnly}
                    itemEntry={itemEntry}
                    preferences={preferences}
                    key={itemEntry[0]}
                    subcategory={subcategory}
                  />
                ))}
              </section>
            ))}
          </Container.Center>
        </ErrorBoundary>
      ))}
    </div>
  );
}

function CollectionPreferenceItem({
  category,
  subcategory,
  itemEntry,
  preferences,
  isReadOnly,
}: {
  readonly category: string;
  readonly subcategory: string;
  readonly itemEntry: ItemEntry;
  readonly preferences: CollectionPreferencesInstance;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const [name, item] = itemEntry;
  const [value, setValue] = preferences.use(
    category as never,
    subcategory as never,
    name as never
  );

  const handleChange = React.useCallback(
    (newValue: unknown) => {
      if (isReadOnly) return;
      setValue(newValue as never);
    },
    [isReadOnly, setValue]
  );

  const Renderer = 'renderer' in item ? item.renderer : DefaultPreferenceItemRender;
  const props = {
    className: `flex items-start gap-2 md:flex-row flex-col ${
      isReadOnly ? '!cursor-not-allowed' : ''
    }`,
    key: name,
  } as const;

  const content = (
    <>
      <div className="flex flex-col items-start gap-2 md:flex-1 md:items-stretch">
        <p className="flex min-h-[theme(spacing.8)] flex-1 items-center justify-end md:text-right">
          {typeof item.title === 'function' ? item.title() : item.title}
        </p>
        {item.description !== undefined && (
          <p className="flex flex-1 justify-end text-gray-500 md:text-right">
            {typeof item.description === 'function' ? item.description() : item.description}
          </p>
        )}
      </div>
      <div className="flex min-h-[theme(spacing.8)] flex-1 flex-col justify-center gap-2">
        <ReadOnlyContext.Provider value={isReadOnly}>
          <Renderer
            category={category}
            definition={item}
            item={name}
            subcategory={subcategory}
            value={value}
            onChange={handleChange}
          />
        </ReadOnlyContext.Provider>
      </div>
    </>
  );

  return 'container' in item && item.container === 'div' ? (
    <div {...props}>{content}</div>
  ) : (
    <label {...props}>{content}</label>
  );
}

function CollectionPreferences(): JSX.Element {
  const [changesMade, markChangesMade, clearChanges] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();
  const {
    visibleChild,
    setVisibleChild,
    forwardRefs,
    references,
    scrollContainerRef,
  } = useTopChild();
  const definitions = useCollectionPrefDefinitions();

  React.useEffect(() => {
    let cancelled = false;

    const migrateFromRemotePrefs = async () => {
      await fetchRemotePrefs;
      if (cancelled) return;

      const collectionId = schema.domainLevelIds.collection;
      const migrationTargets: ReadonlyArray<{
        readonly category: string;
        readonly subcategory: string;
        readonly name: string;
        readonly value: () => boolean;
      }> = [
        {
          category: 'general',
          subcategory: 'pickLists',
          name: 'sp7_scope_table_picklists',
          value: () => getCollectionPref('sp7_scope_table_picklists', collectionId),
        },
        {
          category: 'general',
          subcategory: 'attachments',
          name: 'attachment.is_public_default',
          value: () => getPref('attachment.is_public_default'),
        },
        ...['GeologicTimePeriod', 'Taxon', 'Geography', 'LithoStrat', 'Storage', 'TectonicUnit'].map(
          (treeName) => ({
            category: 'treeManagement',
            subcategory: 'synonymized',
            name: `sp7.allow_adding_child_to_synonymized_parent.${treeName}`,
            value: () => getPref(`sp7.allow_adding_child_to_synonymized_parent.${treeName}`),
          })
        ),
      ];

      migrationTargets.forEach(({ category, subcategory, name, value }) => {
        const current = (collectionPreferences.getRaw() as Record<string, any>)[category]?.[subcategory]?.[name];
        if (current !== undefined) return;
        const definition = collectionPreferences.definition(
          category as never,
          subcategory as never,
          name as never
        );
        const remoteValue = value();
        if (remoteValue === definition.defaultValue) return;
        collectionPreferences.set(
          category as never,
          subcategory as never,
          name as never,
          remoteValue as never
        );
      });
    };

    void migrateFromRemotePrefs();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() =>
    collectionPreferences.events.on('update', () => {
      markChangesMade();
    }), [markChangesMade]);

  return (
    <ProtectedTool action="update" tool="resources">
      <Container.FullGray>
        <H2 className="text-2xl">{preferencesText.collectionPreferences()}</H2>
        <Form
          className="contents"
          onSubmit={(): void =>
            loading(
              collectionPreferences
                .awaitSynced()
                .then(() => {
                  clearChanges();
                  navigate('/specify/');
                })
            )
          }
        >
          <div
            className="relative flex flex-col gap-6 overflow-y-auto md:flex-row"
            ref={scrollContainerRef}
          >
            <CollectionPreferencesAside
              activeCategory={visibleChild}
              definitions={definitions}
              references={references}
              setActiveCategory={setVisibleChild}
            />
            <CollectionPreferencesContent
              definitions={definitions}
              preferences={collectionPreferences}
              forwardRefs={forwardRefs}
            />
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
    </ProtectedTool>
  );
}

export function CollectionPreferencesWrapper(): JSX.Element | null {
  const [hasFetched] = usePromise(preferencesPromise, true);
  return hasFetched ? <CollectionPreferences /> : null;
}

export function CollectionPreferencesEditor({
  data,
  onChange,
}: AppResourceTabProps): JSX.Element {
  const [preferencesInstance] = useLiveState(
    React.useCallback(() => {
      const prefs = new BasePreferences({
        definitions: collectionPreferenceDefinitions,
        values: {
          resourceName: 'CollectionPreferences',
          fetchUrl: '/context/collection_resource/',
        },
        defaultValues: undefined,
        developmentGlobal: '_editingCollectionPreferences',
        syncChanges: false,
      });
      prefs.setRaw(JSON.parse(data === null || data.length === 0 ? '{}' : data));
      prefs.events.on('update', () => onChange(JSON.stringify(prefs.getRaw())));
      return prefs;
    }, [onChange])
  );

  const definitions = useCollectionPrefDefinitions();
  const Context = preferencesInstance.Context;

  return (
    <Context.Provider value={preferencesInstance}>
      <ReadOnlyContext.Provider value={false}>
        <CollectionPreferencesContent
          definitions={definitions}
          preferences={preferencesInstance}
        />
      </ReadOnlyContext.Provider>
    </Context.Provider>
  );
}
