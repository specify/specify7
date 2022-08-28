import React from 'react';

import type { AppResourceFilters as AppResourceFiltersType } from './filtersHelpers';
import {
  allAppResources,
  countAppResources,
  defaultAppResourceFilters,
  filterAppResources,
  hasAllAppResources,
} from './filtersHelpers';
import { toggleItem } from '../../utils/utils';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { appResourceSubTypes, appResourceTypes } from './Create';
import type { AppResources } from './hooks';
import { Ul } from '../Atoms';
import { Dialog } from '../Molecules/Dialog';
import { useCachedState } from '../../hooks/useCachedState';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { useBooleanState } from '../../hooks/useBooleanState';

export function AppResourcesFilters({
  initialResources,
}: {
  readonly initialResources: AppResources;
}): JSX.Element {
  const [filters = defaultAppResourceFilters, setFilters] = useCachedState(
    'appResources',
    'filters'
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
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
                  onValueChange={(isChecked): void =>
                    setFilters({
                      ...filters,
                      viewSets: isChecked,
                    })
                  }
                />
                {appResourceTypes.viewSets.icon}
                {`${commonText('viewSets')} (${countAppResources(
                  initialResources,
                  { appResources: [], viewSets: true }
                )})`}
              </Label.Inline>
            </li>
            <li>
              <Label.Inline>
                <Input.Checkbox
                  checked={hasAllAppResources(filters.appResources)}
                  onValueChange={(isChecked): void =>
                    setFilters({
                      ...filters,
                      appResources: isChecked ? allAppResources : [],
                    })
                  }
                />
                {appResourceTypes.appResources.icon}
                {`${commonText('appResources')} (${countAppResources(
                  initialResources,
                  { appResources: allAppResources, viewSets: false }
                )})`}
              </Label.Inline>
              <Ul className="pl-6">
                {Object.entries(appResourceSubTypes).map(
                  ([key, { label, icon }]): JSX.Element => (
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
  const [filters = initialFilters] = useCachedState('appResources', 'filters');
  return React.useMemo(
    () => filterAppResources(initialResources, filters),
    [filters, initialResources]
  );
}
