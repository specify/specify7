import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { toggleItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Dialog } from '../Molecules/Dialog';
import type { AppResourceFilters as AppResourceFiltersType } from './filtersHelpers';
import {
  allAppResources,
  countAppResources,
  defaultAppResourceFilters,
  filterAppResources,
  hasAllAppResources,
} from './filtersHelpers';
import type { AppResources } from './hooks';
import { appResourceSubTypes, appResourceTypes } from './types';

export function AppResourcesFilters({
  initialResources,
}: {
  readonly initialResources: AppResources;
}): JSX.Element {
  const [filters = defaultAppResourceFilters, setFilters] = useCachedState(
    'appResources',
    'filters'
  );

  const handleToggleViewSets = (): void =>
    setFilters({
      ...filters,
      viewSets: !filters.viewSets,
    });
  const showResources = hasAllAppResources(filters.appResources);
  const handleToggleResources = (): void =>
    setFilters({
      ...filters,
      appResources: showResources ? [] : allAppResources,
    });

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Blue
        aria-pressed={filters.viewSets}
        onClick={handleToggleViewSets}
      >
        {commonText('formDefinitions')}
      </Button.Blue>
      <Button.Blue aria-pressed={showResources} onClick={handleToggleResources}>
        {commonText('appResources')}
      </Button.Blue>
      <Button.Blue onClick={handleOpen}>{adminText('filters')}</Button.Blue>
      {isOpen && (
        <Dialog
          buttons={commonText('close')}
          header={adminText('filters')}
          modal={false}
          onClose={handleClose}
        >
          <Ul>
            <li>
              <Label.Inline>
                <Input.Checkbox
                  checked={filters.viewSets}
                  onValueChange={handleToggleViewSets}
                />
                {appResourceTypes.viewSets.icon}
                {`${commonText('formDefinitions')} (${countAppResources(
                  initialResources,
                  { appResources: [], viewSets: true }
                )})`}
              </Label.Inline>
            </li>
            <li>
              <Label.Inline>
                <Input.Checkbox
                  checked={showResources}
                  onValueChange={handleToggleResources}
                />
                {appResourceTypes.appResources.icon}
                {`${commonText('appResources')} (${countAppResources(
                  initialResources,
                  { appResources: allAppResources, viewSets: false }
                )})`}
              </Label.Inline>
              <Ul className="pl-6">
                {Object.entries(appResourceSubTypes).map(
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
                        {`${label} (${countAppResources(initialResources, {
                          appResources: [key],
                          viewSets: false,
                        })})`}
                        {typeof documentationUrl === 'string' && (
                          <Link.Icon
                            href={documentationUrl}
                            icon="externalLink"
                            target="_blank"
                            title={commonText('documentation')}
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

export function useFilteredAppResources(
  initialResources: AppResources,
  initialFilters: AppResourceFiltersType | undefined = defaultAppResourceFilters
): AppResources {
  const [filters, setFilters] = useCachedState('appResources', 'filters');

  React.useEffect(() => {
    if (initialFilters === defaultAppResourceFilters) return undefined;
    setFilters(initialFilters);
    const oldFilter = filters;
    return (): void => setFilters(oldFilter);
  }, [setFilters]);

  const nonNullFilters = filters ?? initialFilters;
  return React.useMemo(
    () => filterAppResources(initialResources, nonNullFilters),
    [nonNullFilters, initialResources]
  );
}
