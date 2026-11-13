import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { headerText } from '../../localization/header';
import { resourcesText } from '../../localization/resources';
import { toggleItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import {
  allAppResources,
  countAppResources,
  defaultAppResourceFilters,
} from './filtersHelpers';
import type { AppResources } from './hooks';
import { appResourceSubTypes, appResourceTypes } from './types';

const filterOptionClassName =
  'flex h-full items-center justify-center rounded px-1 py-0.5 text-center hover:bg-gray-200 dark:hover:bg-neutral-700 peer-checked:bg-[color:var(--info-button-color)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-300';

export function AppResourcesFilters({
  initialResources,
}: {
  readonly initialResources: AppResources;
}): JSX.Element {
  const [filters = defaultAppResourceFilters, setFilters] = useCachedState(
    'appResources',
    'filters'
  );

  const hasCollectionPrefEditPermission = hasPermission(
    '/preferences/collection',
    'edit_collection'
  );

  const filteredAppResources = React.useMemo(
    () =>
      hasCollectionPrefEditPermission
        ? allAppResources
        : allAppResources.filter((type) => type !== 'collectionPreferences'),
    [hasCollectionPrefEditPermission]
  );
  const id = useId('resource-filters');
  // Ignore inaccessible types when recognizing the current preset.
  const selectedTypes = filteredAppResources.filter((type) =>
    filters.appResources.includes(type)
  );
  const showAllResources = selectedTypes.length === filteredAppResources.length;
  const isAll = filters.viewSets && showAllResources;
  const isFormsOnly = filters.viewSets && selectedTypes.length === 0;
  const isAppResourcesOnly = !filters.viewSets && showAllResources;
  const isCustom = !isAll && !isFormsOnly && !isAppResourcesOnly;
  const handleShowAll = (): void =>
    setFilters({ viewSets: true, appResources: filteredAppResources });

  const handleToggleResources = (): void =>
    setFilters({
      ...filters,
      appResources: showAllResources ? [] : filteredAppResources,
    });

  const [isOpen, handleOpen, handleClose] = useBooleanState();

  return (
    <>
      <fieldset className="min-w-0">
        <legend className="mb-1 text-sm text-gray-600 dark:text-neutral-400">
          {resourcesText.showResources()}
        </legend>
        <div className="grid min-w-0 grid-cols-[auto_auto_auto_2rem] items-stretch gap-0.5 rounded bg-[color:var(--field-background)] p-0.5 shadow-sm ring-1 ring-gray-400 dark:ring-0">
          <label className="min-w-0 cursor-pointer">
            <Input.Radio
              aria-label={resourcesText.allResources()}
              className="peer sr-only"
              checked={isAll}
              name={id('visibility')}
              value="all"
              onChange={handleShowAll}
            />
            <span className={filterOptionClassName}>{commonText.all()}</span>
          </label>
          <label className="min-w-0 cursor-pointer">
            <Input.Radio
              className="peer sr-only"
              checked={isFormsOnly}
              name={id('visibility')}
              value="forms"
              onChange={(): void =>
                setFilters({ viewSets: true, appResources: [] })
              }
            />
            <span className={filterOptionClassName}>{formsText.forms()}</span>
          </label>
          <label className="min-w-0 cursor-pointer">
            <Input.Radio
              className="peer sr-only"
              checked={isAppResourcesOnly}
              name={id('visibility')}
              value="appResources"
              onChange={(): void =>
                setFilters({
                  viewSets: false,
                  appResources: filteredAppResources,
                })
              }
            />
            <span className={filterOptionClassName}>
              {resourcesText.appResources()}
            </span>
          </label>
          <Button.Icon
            aria-label={resourcesText.filterByType()}
            aria-pressed={isCustom}
            className={`self-stretch p-1 ${className.ariaHandled} ${
              isCustom
                ? className.infoButton
                : 'hover:bg-gray-200 dark:hover:bg-neutral-700'
            }`}
            icon="cog"
            title={resourcesText.filterByType()}
            onClick={handleOpen}
          />
        </div>
      </fieldset>
      {isOpen && (
        <Dialog
          buttons={commonText.close()}
          header={resourcesText.filters()}
          modal={false}
          onClose={handleClose}
        >
          <Ul>
            <li>
              <Label.Inline>
                <Input.Checkbox
                  checked={filters.viewSets}
                  onValueChange={(): void =>
                    setFilters({
                      ...filters,
                      viewSets: !filters.viewSets,
                    })
                  }
                />
                {appResourceTypes.viewSets.icon}
                {commonText.countLine({
                  resource: resourcesText.formDefinitions(),
                  count: countAppResources(initialResources, {
                    appResources: [],
                    viewSets: true,
                  }),
                })}
              </Label.Inline>
            </li>
            <li>
              <Label.Inline>
                <Input.Checkbox
                  checked={showAllResources}
                  forwardRef={(input): void => {
                    if (input !== null)
                      input.indeterminate =
                        selectedTypes.length > 0 && !showAllResources;
                  }}
                  onValueChange={handleToggleResources}
                />
                {appResourceTypes.appResources.icon}
                {commonText.countLine({
                  resource: resourcesText.appResources(),
                  count: countAppResources(initialResources, {
                    appResources: filteredAppResources,
                    viewSets: false,
                  }),
                })}
              </Label.Inline>
              <Ul className="pl-6">
                {Object.entries(appResourceSubTypes)
                  .filter(
                    ([key]) =>
                      hasCollectionPrefEditPermission ||
                      key !== 'collectionPreferences'
                  )
                  .map(
                    ([key, { label, icon, documentationUrl }]): JSX.Element => (
                      <li key={key}>
                        <Label.Inline>
                          <Input.Checkbox
                            checked={filters.appResources.includes(key)}
                            onValueChange={(): void =>
                              setFilters({
                                ...filters,
                                appResources: toggleItem(
                                  filters.appResources,
                                  key
                                ),
                              })
                            }
                          />
                          {icon}
                          {commonText.countLine({
                            resource: label,
                            count: countAppResources(initialResources, {
                              appResources: [key],
                              viewSets: false,
                            }),
                          })}
                          {typeof documentationUrl === 'string' && (
                            <Link.Icon
                              href={documentationUrl}
                              icon="externalLink"
                              target="_blank"
                              title={headerText.documentation()}
                            />
                          )}
                        </Label.Inline>
                      </li>
                    )
                  )}
              </Ul>
            </li>
          </Ul>
        </Dialog>
      )}
    </>
  );
}

export const radioButtonClassName = (isPressed: boolean): string => `
  ${className.niceButton} ${className.ariaHandled}
  ${
    isPressed
      ? className.infoButton
      : 'hover:bg-gray-300 hover:dark:bg-neutral-600'
  }
`;
