/**
 * Edit user preferences
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { hasPermission } from '../../permissions';
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
import type { UserTool } from '../main';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
} from '../preferences';
import { preferenceDefinitions } from '../preferences';
import { prefEvents, usePref } from '../preferenceshooks';
import { DefaultPreferenceItemRender } from '../preferencesrenderers';

function Preferences({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('preferences'));

  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);

  // Hide invisible preferences. Remote empty categories and subCategories
  const definitions = Object.entries(
    preferenceDefinitions as GenericPreferencesCategories
  )
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
    .filter(([_name, { subCategories }]) => subCategories.length > 0);

  React.useEffect(
    () =>
      prefEvents.on('update', (definition) => {
        if (definition?.requiresReload === true) handleRestartNeeded();
        handleChangesMade();
      }),
    [handleChangesMade, handleRestartNeeded]
  );

  const id = useId('preferences');
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{commonText('preferences')}</H2>
      <Form
        className="contents"
        onSubmit={(): void =>
          loading(
            awaitPrefsSynced().then(() =>
              needsRestart ? globalThis.location.assign('/') : handleClose()
            )
          )
        }
      >
        <div className="relative flex gap-6 overflow-y-auto">
          {/* FEATURE: highlight link that corresponds to current section */}
          <aside
            className={`min-w-fit sticky top-0 flex flex-col flex-1 divide-y-4
             divide-[color:var(--form-background)]`}
          >
            {definitions.map(([category, { title }]) => (
              <Link.Gray href={`#${id(category)}`} key={category}>
                {title}
              </Link.Gray>
            ))}
          </aside>
          <div className="h-fit flex flex-col gap-6">
            {definitions.map(
              ([
                category,
                { title, description = undefined, subCategories },
              ]) => (
                <ErrorBoundary dismissable key={category}>
                  <Container.Center
                    className="gap-8 overflow-y-visible"
                    id={id(category)}
                  >
                    <h3 className="text-2xl">{title}</h3>
                    {description !== undefined && <p>{description}</p>}
                    {subCategories.map(
                      ([
                        subcategory,
                        { title, description = undefined, items },
                      ]) => (
                        <section
                          key={subcategory}
                          className="flex flex-col gap-4"
                        >
                          <div className="flex items-center">
                            <span className="flex-1" />
                            <h4
                              className={`${className.headerGray} text-xl text-center`}
                            >
                              {title}
                            </h4>
                            <div className="flex justify-end flex-1">
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
                                        getPrefDefinition(
                                          category,
                                          subcategory,
                                          name
                                        )
                                      ).defaultValue
                                    )
                                  )
                                }
                              >
                                {preferencesText('reset')}
                              </Button.Small>
                            </div>
                          </div>
                          {description !== undefined && <p>{description}</p>}
                          {items.map(([name, item]) => {
                            const canEdit =
                              item.visible !== 'adminsOnly' ||
                              hasPermission(
                                '/preferences/user',
                                'edit_protected'
                              );
                            return (
                              <label
                                key={name}
                                className={`flex items-start gap-2 ${
                                  canEdit ? '' : '!cursor-not-allowed'
                                }`}
                                title={
                                  canEdit
                                    ? undefined
                                    : preferencesText('adminsOnlyPreference')
                                }
                              >
                                <div className="flex flex-col flex-1 gap-2">
                                  <p
                                    className={`flex items-center justify-end flex-1
                              text-right min-h-[theme(spacing.8)]`}
                                  >
                                    {item.title}
                                  </p>
                                  {item.description !== undefined && (
                                    <p className="flex justify-end flex-1 text-right text-gray-500">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                                <div
                                  className={`flex flex-col justify-center flex-1 gap-2
                            min-h-[theme(spacing.8)]`}
                                >
                                  <Item
                                    item={item}
                                    category={category}
                                    subcategory={subcategory}
                                    name={name}
                                    isReadOnly={!canEdit}
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
      value={value}
      onChange={setValue}
      isReadOnly={isReadOnly}
    />
  );
  return 'renderer' in item ? (
    <ErrorBoundary dismissable>{children}</ErrorBoundary>
  ) : (
    children
  );
}

function PreferencesWrapper({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element | null {
  const [preferences] = useAsyncState(
    React.useCallback(async () => preferencesPromise, []),
    true
  );
  return typeof preferences === 'object' ? (
    <Preferences onClose={handleClose} />
  ) : null;
}

export const userTool: UserTool = {
  task: 'preferences',
  title: commonText('preferences'),
  isOverlay: false,
  view: ({ onClose: handleClose }) => (
    <PreferencesWrapper onClose={handleClose} />
  ),
  groupLabel: commonText('customization'),
};
