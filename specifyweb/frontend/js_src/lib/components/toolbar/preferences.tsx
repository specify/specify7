/**
 * Edit user preferences
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { hasPermission } from '../../permissions';
import {
  awaitPrefsSynced,
  preferencesPromise,
  setPref,
} from '../../preferencesutils';
import { Button, className, Container, Form, H2, Link, Submit } from '../basic';
import { LoadingContext } from '../contexts';
import { useAsyncState, useBooleanState, useId, useTitle } from '../hooks';
import { icons } from '../icons';
import type { UserTool } from '../main';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
} from '../preferences';
import { preferenceDefinitions } from '../preferences';
import { prefEvents, usePref } from '../preferenceshooks';
import { DefaultPreferenceItemRender } from '../preferencesrenderers';
import { createBackboneView } from '../reactbackboneextend';

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
                        ([_name, { visible }]) =>
                          visible === true ||
                          (visible === 'adminsOnly' &&
                            hasPermission('/preferences/user', 'edit_hidden'))
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
    <Container.Full>
      <H2>{commonText('preferences')}</H2>
      <Form
        className="contents"
        onSubmit={(): void =>
          loading(
            awaitPrefsSynced().then(() =>
              needsRestart ? window.location.assign('/') : handleClose()
            )
          )
        }
      >
        <div className="relative flex gap-6 overflow-y-auto">
          {/* TODO: highlight link that corresponds to current section */}
          <aside className="sticky top-0">
            <menu>
              {definitions.map(([category, { title }]) => (
                <li key={category}>
                  <Link.Default href={`#${id(category)}`}>{title}</Link.Default>
                </li>
              ))}
            </menu>
          </aside>
          <div className="flex flex-col flex-1 gap-6 overflow-y-auto">
            {definitions.map(
              ([
                category,
                { title, description = undefined, subCategories },
              ]) => (
                <Container.Base
                  key={category}
                  className="gap-8"
                  id={id(category)}
                >
                  <h3 className="text-2xl">{title}</h3>
                  {typeof description === 'string' && <p>{description}</p>}
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
                          <h4 className={`${className.headerGray} text-center`}>
                            {title}
                          </h4>
                          <div className="flex justify-end flex-1">
                            <Button.Blue
                              aria-label={preferencesText('resetToDefault')}
                              title={preferencesText('resetToDefault')}
                              className="!p-1"
                              onClick={(): void =>
                                items.forEach(([name, { defaultValue }]) =>
                                  setPref(
                                    category,
                                    subcategory,
                                    name,
                                    defaultValue
                                  )
                                )
                              }
                            >
                              {icons.refresh}
                            </Button.Blue>
                          </div>
                        </div>
                        {typeof description === 'string' && (
                          <p>{description}</p>
                        )}
                        {items.map(([name, item]) => (
                          <label key={name} className="flex items-start gap-2">
                            <div className="flex flex-col flex-1 gap-2">
                              <p
                                className={`flex items-center justify-end flex-1
                              text-right min-h-[theme(spacing.8)]`}
                              >
                                {item.title}
                              </p>
                              {typeof item.description === 'string' && (
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
                              />
                            </div>
                          </label>
                        ))}
                      </section>
                    )
                  )}
                </Container.Base>
              )
            )}
          </div>
        </div>
        <div className="flex justify-end">
          {changesMade ? (
            <Submit.Green>{commonText('save')}</Submit.Green>
          ) : (
            <Link.Gray href="/specify/">{commonText('close')}</Link.Gray>
          )}
        </div>
      </Form>
    </Container.Full>
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
  const [value, setValue] = usePref(category, subcategory, name);
  return <Renderer definition={item} value={value} onChange={setValue} />;
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

const PreferencesView = createBackboneView(PreferencesWrapper);
export const userTool: UserTool = {
  task: 'preferences',
  title: commonText('preferences'),
  isOverlay: false,
  view: ({ onClose }) => new PreferencesView({ onClose }),
  groupLabel: commonText('customization'),
};
