/**
 * Edit collection preferences
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { preferencesText } from '../../localization/preferences';
import { StringToJsx } from '../../localization/utils';
import { f } from '../../utils/functools';
import { Container, Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasPermission } from '../Permissions/helpers';
import { ProtectedTool } from '../Permissions/PermissionDenied';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { collectionPreferences } from './collectionPreferences';
import { DefaultPreferenceItemRender } from './Renderers';
import type { GenericPreferences, PreferenceItem } from './types';

const preferencesPromise = Promise.all([collectionPreferences.fetch()]).then(
  f.true
);

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

export function useCollectionPrefDefinitions() {
  const visibilityContext = React.useMemo(
    () => ({ isDarkMode: false, isRedirecting: false }),
    []
  );
  return React.useMemo(
    () =>
      Object.entries(collectionPreferenceDefinitions as GenericPreferences)
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
    [visibilityContext]
  );
}

type ItemEntry = ReturnType<
  typeof useCollectionPrefDefinitions
>[number][1]['subCategories'][number][1]['items'][number];

export function CollectionPreferencesContent(): JSX.Element {
  const definitions = useCollectionPrefDefinitions();

  return (
    <div className="flex h-fit flex-col gap-6">
      {definitions.map(
        ([category, { title, description = undefined, subCategories }]) => (
          <ErrorBoundary dismissible key={category}>
            <Container.Center
              className="gap-8 overflow-y-visible"
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
                ([subcategory, { title, description: subDesc, items }]) => (
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
                              const def = collectionPreferences.definition(
                                category as never,
                                subcategory as never,
                                name as never
                              );
                              collectionPreferences.set(
                                category as never,
                                subcategory as never,
                                name as never,
                                (def as { readonly defaultValue: unknown })
                                  .defaultValue as never
                              );
                            })
                          }
                        >
                          {commonText.reset()}
                        </Button.Small>
                      </div>
                    </div>

                    {subDesc !== undefined && (
                      <p>
                        {typeof subDesc === 'function' ? subDesc() : subDesc}
                      </p>
                    )}

                    {items.map((entry) => (
                      <CollectionPreferenceItem
                        category={category}
                        itemEntry={entry}
                        key={entry[0]}
                        subcategory={subcategory}
                      />
                    ))}
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

function CollectionPreferenceItem({
  category,
  subcategory,
  itemEntry,
}: {
  readonly category: string;
  readonly subcategory: string;
  readonly itemEntry: ItemEntry;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const [name, item] = itemEntry;

  const canEdit =
    !isReadOnly &&
    (item.visible !== 'protected' ||
      hasPermission('/preferences/user', 'edit_protected'));

  const [value, setValue] = collectionPreferences.use(
    category as never,
    subcategory as never,
    name as never
  );

  const Renderer =
    'renderer' in item ? item.renderer : DefaultPreferenceItemRender;

  // Minimal doc link mapping
  const documentHref: string | undefined = (() => {
    if (name === 'sp7_scope_table_picklists') return DOCS.picklists;
    if (name === 'attachment.is_public_default') return DOCS.attachments;
    if (name.startsWith('sp7.allow_adding_child_to_synonymized_parent.'))
      return DOCS.trees;
    if (name === 'showPreparationsTotal' || name === 'refreshRate')
      return DOCS.stats;
    if (name === 'publishingOrganization' || name === 'collectionKey')
      return DOCS.specifyNetwork;
    if (category.startsWith('catalogNumber')) return DOCS.catalogNumbers;
    return undefined;
  })();

  const wrapperProps = {
    className: `
      flex items-start gap-2 md:flex-row flex-col
      ${canEdit ? '' : '!cursor-not-allowed'}
    `,
    title: canEdit ? undefined : preferencesText.adminsOnlyPreference(),
  } as const;

  const content = (
    <>
      <div className="flex flex-col items-start gap-2 md:flex-1 md:items-stretch">
        <p className="flex min-h-[theme(spacing.8)] flex-1 items-center justify-end md:text-right">
          <FormatString
            text={
              typeof item.title === 'function'
                ? item.title()
                : (item.title as LocalizedString)
            }
          />
        </p>

        {(item.description !== undefined || documentHref) && (
          <p className="flex flex-1 justify-end text-gray-500 md:text-right">
            {item.description !== undefined && (
              <FormatString
                text={
                  typeof item.description === 'function'
                    ? item.description()
                    : (item.description as LocalizedString)
                }
              />
            )}
            {documentHref && (
              <>
                {item.description ? ' ' : null}
                <Link.NewTab href={documentHref}>
                  {headerText.documentation()}
                </Link.NewTab>
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex min-h-[theme(spacing.8)] flex-1 flex-col justify-center gap-2">
        <ReadOnlyContext.Provider value={!canEdit}>
          <Renderer
            category={category}
            definition={item}
            item={name}
            subcategory={subcategory}
            value={value}
            onChange={setValue}
          />
        </ReadOnlyContext.Provider>
      </div>
    </>
  );

  return 'container' in item && item.container === 'div' ? (
    <div {...wrapperProps}>{content}</div>
  ) : (
    <label {...wrapperProps}>{content}</label>
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

function CollectionPreferences(): JSX.Element {
  return (
    <ProtectedTool action="update" tool="resources">
      <div className="relative flex flex-col gap-6 overflow-y-auto">
        <CollectionPreferencesContent />
      </div>
    </ProtectedTool>
  );
}

export function CollectionPreferencesWrapper(): JSX.Element | null {
  const [hasFetched] = usePromise(preferencesPromise, true);
  return hasFetched === true ? <CollectionPreferences /> : null;
}
