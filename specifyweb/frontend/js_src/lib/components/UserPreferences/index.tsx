/**
 * Edit user preferences
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { StringToJsx } from '../../localization/utils';
import { Container, H2, Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasPermission } from '../Permissions/helpers';
import { PreferencesAside, useActiveCategory } from './Aside';
import type {
  GenericPreferencesCategories,
  PreferenceItem,
} from './Definitions';
import { preferenceDefinitions } from './Definitions';
import {
  awaitPrefsSynced,
  getPrefDefinition,
  preferencesPromise,
  setPref,
} from './helpers';
import { prefEvents } from './Hooks';
import { DefaultPreferenceItemRender } from './Renderers';
import { usePref } from './usePref';

function Preferences(): JSX.Element {
  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);
  const id = useId('preferences');
  const navigate = useNavigate();

  React.useEffect(
    () =>
      prefEvents.on('update', (payload) => {
        if (payload?.definition?.requiresReload === true) handleRestartNeeded();
        handleChangesMade();
      }),
    [handleChangesMade, handleRestartNeeded]
  );

  const { activeCategory, forwardRefs, containerRef } = useActiveCategory();

  return (
    <Container.FullGray>
      <H2 className="text-2xl">{preferencesText.preferences()}</H2>
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
            <Submit.Green>{commonText.save()}</Submit.Green>
          ) : (
            <Link.Gray href="/specify/">{commonText.close()}</Link.Gray>
          )}
        </div>
      </Form>
    </Container.FullGray>
  );
}

/** Hide invisible preferences. Remote empty categories and subCategories */
export function usePrefDefinitions() {
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
  const definitions = usePrefDefinitions();
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
                                getPrefDefinition(category, subcategory, name)
                                  .defaultValue
                              )
                            )
                          }
                        >
                          {commonText.reset()}
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
                              : preferencesText.adminsOnlyPreference()
                          }
                        >
                          <div className="flex flex-1 flex-col gap-2">
                            <p
                              className={`
                                flex min-h-[theme(spacing.8)] flex-1 items-center
                                justify-end text-right
                              `}
                            >
                              <FormatString text={item.title} />
                            </p>
                            {item.description !== undefined && (
                              <p className="flex flex-1 justify-end text-right text-gray-500">
                                <FormatString text={item.description} />
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

function FormatString({
  text,
}: {
  readonly text: JSX.Element | LocalizedString;
}): JSX.Element {
  return typeof text === 'object' ? (
    text
  ) : (text.includes('<key>') ? (
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
  ));
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
    // Asserting types just to simplify typing
    category as 'general',
    subcategory as 'ui',
    name as 'theme'
  );
  const children = (
    <Renderer
      category={category}
      definition={item}
      isReadOnly={isReadOnly}
      item={name}
      subcategory={subcategory}
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
