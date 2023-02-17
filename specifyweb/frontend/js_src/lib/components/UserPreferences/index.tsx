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
import { Container, H2, Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasPermission } from '../Permissions/helpers';
import { PreferencesAside } from './Aside';
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
import { useTopChild } from './useTopChild';

function Preferences(): JSX.Element {
  const [changesMade, handleChangesMade] = useBooleanState();
  const [needsRestart, handleRestartNeeded] = useBooleanState();

  const loading = React.useContext(LoadingContext);
  const navigate = useNavigate();

  React.useEffect(
    () =>
      prefEvents.on('update', (payload) => {
        if (payload?.definition?.requiresReload === true) handleRestartNeeded();
        handleChangesMade();
      }),
    [handleChangesMade, handleRestartNeeded]
  );

  const { visibleChild, forwardRefs, scrollContainerRef } = useTopChild();

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
          ref={scrollContainerRef}
        >
          <PreferencesAside activeCategory={visibleChild} />
          <PreferencesContent forwardRefs={forwardRefs} isReadOnly={false} />
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
  isReadOnly,
  forwardRefs,
}: {
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
          <ErrorBoundary dismissible key={category}>
            <Container.Center
              className="gap-8 overflow-y-visible"
              forwardRef={forwardRefs?.bind(undefined, index)}
              id={category}
            >
              <h3 className="text-2xl">{title}</h3>
              {description !== undefined && <p>{description}</p>}
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
                      const props = {
                        className: `
                            flex items-start gap-2 md:flex-row flex-col
                            ${canEdit ? '' : '!cursor-not-allowed'}
                          `,
                        key: name,
                        title: canEdit
                          ? undefined
                          : preferencesText.adminsOnlyPreference(),
                      } as const;
                      const children = (
                        <>
                          <div className="flex flex-col items-start gap-2 md:flex-1 md:items-stretch">
                            <p
                              className={`
                                flex min-h-[theme(spacing.8)] flex-1 items-center
                                justify-end md:text-right
                              `}
                            >
                              <FormatString text={item.title} />
                            </p>
                            {item.description !== undefined && (
                              <p className="flex flex-1 justify-end text-gray-500 md:text-right">
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
    <ErrorBoundary dismissible>{children}</ErrorBoundary>
  ) : (
    children
  );
}

export function PreferencesWrapper(): JSX.Element | null {
  const [preferences] = usePromise(preferencesPromise, true);
  return typeof preferences === 'object' ? <Preferences /> : null;
}
