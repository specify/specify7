/**
 * Edit user preferences
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { hasPermission } from '../../permissionutils';
import {
  awaitPrefsSynced,
  getPrefDefinition,
  preferencesPromise,
  setPref,
} from '../../preferencesutils';
import { defined } from '../../types';
import { Button, className, Container, Form, H2, Link, Submit } from '../basic';
import { LoadingContext } from '../contexts';
import { ErrorBoundary } from '../errorboundary';
import { useAsyncState, useBooleanState, useId, useTitle } from '../hooks';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
} from '../preferences';
import { preferenceDefinitions } from '../preferences';
import { prefEvents, usePref } from '../preferenceshooks';
import { DefaultPreferenceItemRender } from '../preferencesrenderers';
import { useNavigate } from 'react-router-dom';

function Preferences(): JSX.Element {
  // FIXME: remove redundant useTitle()
  useTitle(commonText('preferences'));

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
        <div className="relative flex flex-col gap-6 overflow-y-auto md:flex-row">
          <PreferencesAside id={id} />
          <PreferencesContent id={id} isReadOnly={false} />
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

function PreferencesAside({
  id,
}: {
  readonly id: (prefix: string) => string;
}): JSX.Element {
  const definitions = useDefinitions();
  // FEATURE: highlight link that corresponds to current section
  return (
    <aside
      className={`
        top-0 flex min-w-fit flex-1 flex-col divide-y-4 divide-[color:var(--form-background)]
        md:sticky
      `}
    >
      {definitions.map(([category, { title }]) => (
        <Link.Gray href={`#${id(category)}`} key={category}>
          {title}
        </Link.Gray>
      ))}
    </aside>
  );
}

function useDefinitions() {
  // Hide invisible preferences. Remote empty categories and subCategories
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
}: {
  readonly id: (prefix: string) => string;
  readonly isReadOnly: boolean;
}): JSX.Element {
  const definitions = useDefinitions();
  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(
        ([category, { title, description = undefined, subCategories }]) => (
          <ErrorBoundary dismissable key={category}>
            <Container.Center
              className="gap-8 overflow-y-visible"
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
