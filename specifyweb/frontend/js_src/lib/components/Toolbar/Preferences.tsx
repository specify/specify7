/**
 * Edit user preferences
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { hasPermission } from '../Permissions/helpers';
import {
  awaitPrefsSynced,
  getPrefDefinition,
  preferencesPromise,
  setPref,
} from '../UserPreferences/helpers';
import type { WritableArray } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import {
  Button,
  className,
  Container,
  Form,
  H2,
  Link,
  Submit,
} from '../Atoms/Basic';
import { LoadingContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useAsyncState, useBooleanState, useId } from '../../hooks/hooks';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
} from '../UserPreferences/Definitions';
import { preferenceDefinitions } from '../UserPreferences/Definitions';
import { prefEvents, usePref } from '../UserPreferences/Hooks';
import { DefaultPreferenceItemRender } from '../UserPreferences/Renderers';

function Preferences(): JSX.Element {
  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);
  const id = useId('preferences');
  const navigate = useNavigate();

  React.useEffect(
    () =>
      prefEvents.on('update', (definition) => {
        if (definition?.requiresReload === true) handleRestartNeeded();
        handleChangesMade();
      }),
    [handleChangesMade, handleRestartNeeded]
  );

  const { activeCategory, forwardRefs, containerRef } = useActiveCategory();

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{commonText('preferences')}</H2>
      <Form
        className="contents"
        onSubmit={(): void =>
          loading(
            awaitPrefsSynced().then(() =>
              needsRestart
                ? globalThis.location.assign('/specify/')
                : navigate('/specify/')
            )
          )
        }
      >
        <div
          className="relative flex flex-col gap-6 overflow-y-auto md:flex-row"
          ref={containerRef}
        >
          <PreferencesAside activeCategory={activeCategory} id={id} />
          <PreferencesContent
            forwardRefs={forwardRefs}
            id={id}
            isReadOnly={false}
          />
          <span className="flex-1" />
        </div>
        <div className="flex justify-end">
          {changesMade ? (
            <Submit.Green>{commonText('save')}</Submit.Green>
          ) : (
            <Link.Gray href="/specify/">{commonText('close')}</Link.Gray>
          )}
        </div>
      </Form>
    </Container.FullGray>
  );
}

/** Update the active category on the sidebar as user scrolls */
function useActiveCategory(): {
  readonly activeCategory: number;
  readonly forwardRefs: (index: number, element: HTMLElement | null) => void;
  readonly containerRef: React.RefCallback<HTMLDivElement | null>;
} {
  const [activeCategory, setActiveCategory] = React.useState<number>(0);
  const observer = React.useRef<IntersectionObserver | undefined>(undefined);
  const references = React.useRef<WritableArray<HTMLElement | undefined>>([]);
  React.useEffect(() => () => observer.current?.disconnect(), []);

  // eslint-disable-next-line functional/prefer-readonly-type
  const intersecting = React.useRef<Set<number>>(new Set());

  function handleObserved({
    isIntersecting,
    target,
  }: IntersectionObserverEntry): void {
    const index = references.current.indexOf(target as HTMLElement);
    intersecting.current[isIntersecting ? 'add' : 'delete'](index);
    const intersection = Math.min(...Array.from(intersecting.current));
    setActiveCategory(intersection);
  }

  return {
    activeCategory,
    forwardRefs: React.useCallback((index, element) => {
      const oldElement = references.current[index];
      if (typeof oldElement === 'object')
        observer.current?.unobserve(oldElement);
      references.current[index] = element ?? undefined;
      if (element !== null) observer?.current?.observe(element);
    }, []),
    containerRef: React.useCallback((container): void => {
      observer.current?.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => entries.map(handleObserved),
        {
          root: container,
          rootMargin: '-200px 0px -100px 0px',
          threshold: 0,
        }
      );
      /*
       * Since React 18, apps running in strict mode are mounted followed
       * immediately by an unmount and the mount again when running in
       * development. This causes observer not to fire. Can be fixed by either
       * running React in non-strict mode (bad idea), or wrapping the following
       * in setTimeout(()=>..., 0);
       * More info:
       * https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-strict-mode
       */
      setTimeout(
        () =>
          filterArray(references.current).forEach((value) =>
            observer.current?.observe(value)
          ),
        0
      );
    }, []),
  };
}

function PreferencesAside({
  id,
  activeCategory,
}: {
  readonly id: (prefix: string) => string;
  readonly activeCategory: number;
}): JSX.Element {
  const definitions = useDefinitions();
  const navigate = useNavigate();
  React.useEffect(
    () =>
      navigate(
        `/specify/user-preferences/#${id(definitions[activeCategory][0])}`,
        {
          replace: true,
        }
      ),
    [definitions, activeCategory, id]
  );
  return (
    <aside
      className={`
        top-0 flex min-w-fit flex-1 flex-col divide-y-4 divide-[color:var(--form-background)]
        md:sticky
      `}
    >
      {definitions.map(([category, { title }], index) => (
        <Link.Gray
          aria-current={activeCategory === index ? 'page' : undefined}
          href={`#${id(category)}`}
          key={category}
        >
          {title}
        </Link.Gray>
      ))}
    </aside>
  );
}

/** Hide invisible preferences. Remote empty categories and subCategories */
function useDefinitions() {
  return React.useMemo(
    () =>
      Object.entries(preferenceDefinitions as GenericPreferencesCategories)
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
                            ([_name, { visible }]) => visible !== false
                          ),
                        },
                      ] as const
                  )
                  .filter(([_name, { items }]) => items.length > 0),
              },
            ] as const
        )
        .filter(([_name, { subCategories }]) => subCategories.length > 0),
    []
  );
}

export function PreferencesContent({
  id,
  isReadOnly,
  forwardRefs,
}: {
  readonly id: (prefix: string) => string;
  readonly isReadOnly: boolean;
  readonly forwardRefs?: (index: number, element: HTMLElement | null) => void;
}): JSX.Element {
  const definitions = useDefinitions();
  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(
        (
          [category, { title, description = undefined, subCategories }],
          index
        ) => (
          <ErrorBoundary dismissable key={category}>
            <Container.Center
              className="gap-8 overflow-y-visible"
              forwardRef={forwardRefs?.bind(undefined, index)}
              id={id(category)}
            >
              <h3 className="text-2xl">{title}</h3>
              {description !== undefined && <p>{description}</p>}
              {subCategories.map(
                ([subcategory, { title, description = undefined, items }]) => (
                  <section className="flex flex-col gap-4" key={subcategory}>
                    <div className="flex items-center">
                      <span className="flex-1" />
                      <h4
                        className={`${className.headerGray} text-center text-xl`}
                      >
                        {title}
                      </h4>
                      <div className="flex flex-1 justify-end">
                        <Button.Small
                          onClick={(): void =>
                            items.forEach(([name]) =>
                              setPref(
                                category,
                                subcategory,
                                name,
                                /*
                                 * Need to get default value via this
                                 * function as defaults may be changed
                                 */
                                defined(
                                  getPrefDefinition(category, subcategory, name)
                                ).defaultValue
                              )
                            )
                          }
                        >
                          {commonText('reset')}
                        </Button.Small>
                      </div>
                    </div>
                    {description !== undefined && <p>{description}</p>}
                    {items.map(([name, item]) => {
                      const canEdit =
                        !isReadOnly &&
                        (item.visible !== 'protected' ||
                          hasPermission('/preferences/user', 'edit_protected'));
                      return (
                        <label
                          className={`
                            flex items-start gap-2
                            ${canEdit ? '' : '!cursor-not-allowed'}
                          `}
                          key={name}
                          title={
                            canEdit
                              ? undefined
                              : preferencesText('adminsOnlyPreference')
                          }
                        >
                          <div className="flex flex-1 flex-col gap-2">
                            <p
                              className={`
                                flex min-h-[theme(spacing.8)] flex-1 items-center
                                justify-end text-right
                              `}
                            >
                              {item.title}
                            </p>
                            {item.description !== undefined && (
                              <p className="flex flex-1 justify-end text-right text-gray-500">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`
                              flex min-h-[theme(spacing.8)] flex-1 flex-col justify-center
                              gap-2
                            `}
                          >
                            <Item
                              category={category}
                              isReadOnly={!canEdit}
                              item={item}
                              name={name}
                              subcategory={subcategory}
                            />
                          </div>
                        </label>
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

function Item({
  item,
  category,
  subcategory,
  name,
  isReadOnly,
}: {
  readonly item: PreferenceItem<any>;
  readonly category: string;
  readonly subcategory: string;
  readonly name: string;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const Renderer =
    'renderer' in item ? item.renderer : DefaultPreferenceItemRender;
  const [value, setValue] = usePref(
    category as 'general',
    subcategory as 'ui',
    name as 'theme'
  );
  const children = (
    <Renderer
      definition={item}
      isReadOnly={isReadOnly}
      value={value}
      onChange={setValue}
    />
  );
  return 'renderer' in item ? (
    <ErrorBoundary dismissable>{children}</ErrorBoundary>
  ) : (
    children
  );
}

export function PreferencesWrapper(): JSX.Element | null {
  const [preferences] = useAsyncState(
    React.useCallback(async () => preferencesPromise, []),
    true
  );
  return typeof preferences === 'object' ? <Preferences /> : null;
}
