import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { f } from '../../utils/functools';
import type { GetSet, RA, WritableArray } from '../../utils/types';
import { GET, removeKey } from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input } from '../Atoms/Form';
import { ReadOnlyContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { PreferenceRendererProps } from '../Preferences/types';
import { entrypointRoutes } from '../Router/EntrypointRouter';
import { overlayRoutes } from '../Router/OverlayRoutes';
import type { EnhancedRoute } from '../Router/RouterUtils';
import { routes } from '../Router/Routes';
import type { KeyboardShortcuts } from './config';
import { emptyShortcuts, KeyboardShortcutPreferenceItem } from './Shortcuts';

export type UrlShortcuts = Partial<Record<string, KeyboardShortcuts>>;

export function UrlShortcutsEditor(
  props: PreferenceRendererProps<UrlShortcuts>
): JSX.Element {
  const [isOpen, _, __, handleToggle] = useBooleanState(false);
  const isReadOnly = React.useContext(ReadOnlyContext);

  return (
    <>
      <div>
        <Button.Small
          aria-current={isOpen ? true : undefined}
          onClick={handleToggle}
        >
          {isReadOnly ? commonText.view() : commonText.edit()}
        </Button.Small>
      </div>
      {isOpen && (
        <EditorDialog
          {...props}
          onChange={(newValue): void => {
            props.onChange(newValue);
            handleToggle();
          }}
        />
      )}
    </>
  );
}

/**
 * This is used in BasePreferences to filter preferences down to keyboard vs
 * non-keyboard preference.
 * (have to set the name explicitly to survive minification)
 */
Object.defineProperty(UrlShortcutsEditor, 'name', {
  value: 'UrlShortcutsEditor',
});

function EditorDialog({
  value,
  onChange: handleChange,
}: PreferenceRendererProps<UrlShortcuts>): JSX.Element {
  const categorizedRoutes = getCategorizedRoutes();
  const localValue = useTriggerState(value);
  return (
    <Dialog
      buttons={commonText.close()}
      className={{
        container: dialogClassNames.wideContainer,
      }}
      header={preferencesText.urlShortcuts()}
      onClose={(): void =>
        handleChange(
          localValue[GET] === value ? value : cleanupShortcuts(localValue[GET])
        )
      }
    >
      <H3>{preferencesText.pages()}</H3>
      <RouteBrowser routes={categorizedRoutes.pages} value={localValue} />
      <H3>{preferencesText.overlays()}</H3>
      <RouteBrowser routes={categorizedRoutes.overlays} value={localValue} />
      <H3>{preferencesText.customPages()}</H3>
      <CustomRouteBrowser categorized={categorizedRoutes} value={localValue} />
    </Dialog>
  );
}

const cleanupShortcuts = (shortcuts: UrlShortcuts): UrlShortcuts =>
  Object.fromEntries(
    Object.entries(shortcuts).filter(
      ([path, shortcuts]) =>
        path.length > 0 &&
        (shortcuts === undefined || Object.keys(shortcuts).length > 0)
    )
  );

type CategorizedRoutes = Record<'overlays' | 'pages', CategoryRoutes>;
type CategoryRoutes = Record<string, LocalizedString | undefined>;

const getCategorizedRoutes = f.store(
  (): CategorizedRoutes => ({
    pages: Object.fromEntries([
      ...scoutTree(entrypointRoutes, ''),
      ...scoutTree(routes, '/specify'),
    ]),
    overlays: Object.fromEntries(scoutTree(overlayRoutes, '/specify')),
  })
);

const scoutTree = (
  routes: RA<EnhancedRoute>,
  prefix: string
): RA<readonly [string, LocalizedString | undefined]> =>
  routes.flatMap((route) => {
    let path = prefix;
    const entries: WritableArray<
      readonly [string, LocalizedString | undefined]
    > = [];

    /*
     * Don't include routes without element as they have nothing to render.
     * Don't include routes where element is a JSX.Element (Redirect,
     * Navigate, NotFound - not interesting for keyboard shortcuts).
     */
    const hasContent = typeof route.element === 'function';

    if (route.path !== undefined) {
      const isDynamic = route.path.includes('*') || route.path.includes(':');
      if (isDynamic) return entries;

      const trimmedPath = route.path.endsWith('/')
        ? route.path.slice(0, -1)
        : route.path;
      path = `${prefix}/${trimmedPath}`;
      if (hasContent) entries.push([path, route.title]);
    } else if (route.index === true && hasContent)
      entries.push([path, route.title]);

    if (route.children) entries.push(...scoutTree(route.children, path));

    return entries;
  });

function RouteBrowser({
  routes,
  value,
}: {
  readonly routes: CategoryRoutes;
  readonly value: GetSet<UrlShortcuts>;
}): JSX.Element {
  return (
    <Ul className="flex flex-col gap-2 mb-4">
      {Object.entries(routes).map(([path, title]) => (
        <RouteShortcut key={path} path={path} title={title} value={value} />
      ))}
    </Ul>
  );
}

function RouteShortcut({
  path,
  title,
  value: [value, setValue],
}: {
  readonly path: string;
  readonly title: LocalizedString | undefined;
  readonly value: GetSet<UrlShortcuts>;
}): JSX.Element {
  return (
    <KeyboardShortcutContainer
      label={
        <div>
          <kbd>{path}</kbd>
          {title !== undefined && ` (${title})`}
        </div>
      }
    >
      <KeyboardShortcutPreferenceItem
        value={value[path]}
        onChange={(newValue): void => setValue({ ...value, [path]: newValue })}
      />
    </KeyboardShortcutContainer>
  );
}

function KeyboardShortcutContainer({
  label,
  children,
}: {
  readonly label: JSX.Element;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <li className="flex gap-2 items-center">
      {label}
      <span className="flex-1 -ml-2" />
      {children}
    </li>
  );
}

function CustomRouteBrowser({
  value: [value, setValue],
  categorized,
}: {
  readonly value: GetSet<UrlShortcuts>;
  readonly categorized: CategorizedRoutes;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <Ul className="flex flex-col gap-2">
      {Object.entries(value).map(([path, shortcuts], index) =>
        path in categorized.pages ||
        path in categorized.overlays ? undefined : (
          <CustomRouteShortcut
            // Don't use path as key to not lose focus as user types path
            key={index}
            path={path}
            shortcuts={shortcuts ?? emptyShortcuts}
            onChange={(newPath, newShortcuts): void =>
              setValue({
                ...removeKey(value, path),
                [newPath]: newShortcuts,
              })
            }
          />
        )
      )}
      {!isReadOnly && (
        <li>
          <Button.Small
            onClick={(): void =>
              setValue({
                ...value,
                '': emptyShortcuts,
              })
            }
          >
            {commonText.add()}
          </Button.Small>
        </li>
      )}
    </Ul>
  );
}

function CustomRouteShortcut({
  path,
  shortcuts,
  onChange: handleChange,
}: {
  readonly path: string;
  readonly shortcuts: KeyboardShortcuts;
  readonly onChange: (path: string, newValue: KeyboardShortcuts) => void;
}): JSX.Element {
  return (
    <KeyboardShortcutContainer
      label={
        <UrlField
          value={path}
          onChange={(path): void => handleChange(path, shortcuts)}
        />
      }
    >
      <KeyboardShortcutPreferenceItem
        value={shortcuts}
        onChange={(shortcuts): void => handleChange(path, shortcuts)}
      />
    </KeyboardShortcutContainer>
  );
}

function UrlField({
  value,
  onChange: handleChange,
}: {
  readonly value: string;
  readonly onChange: (newValue: string) => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [pendingValue, setPendingValue] = useTriggerState(value);
  return (
    <Input.Text
      aria-label={preferencesText.relativeOrAbsoluteUrl()}
      isReadOnly={isReadOnly}
      placeholder={preferencesText.relativeOrAbsoluteUrl()}
      required
      value={pendingValue}
      onBlur={({ target }): void => {
        try {
          const trimmed = target.value.trim();
          const url = new URL(trimmed, globalThis.location.href);
          const isSameOrigin = url.origin === globalThis.location.origin;
          const normalized = isSameOrigin
            ? `${url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname}${url.search}${url.hash}`
            : url.href;
          handleChange(normalized);
          target.setCustomValidity('');
        } catch (error: unknown) {
          target.setCustomValidity(String(error));
          target.reportValidity();
        }
      }}
      onValueChange={setPendingValue}
    />
  );
}
