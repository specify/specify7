import React from 'react';

import type { AppResourceFilters as AppResourceFiltersType } from '../appresourcesfilters';
import {
  allAppResources,
  countAppResources,
  defaultAppResourceFilters,
  filterAppResources,
  hasAllAppResources,
} from '../appresourcesfilters';
import { toggleItem } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { appResourceSubTypes, appResourceTypes } from './appresourcescreate';
import type { AppResources } from './appresourceshooks';
import { Button, Input, Label, Ul } from './basic';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { useCachedState } from './statecache';

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
          header={adminText('filters')}
          onClose={handleClose}
          buttons={commonText('close')}
          modal={false}
        >
          <Ul>
            <li>
              <Label.ForCheckbox>
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
              </Label.ForCheckbox>
            </li>
            <li>
              <Label.ForCheckbox>
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
              </Label.ForCheckbox>
              <Ul className="pl-6">
                {Object.entries(appResourceSubTypes).map(
                  ([key, { label, icon }]): JSX.Element => (
                    <li key={key}>
                      <Label.ForCheckbox>
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
                      </Label.ForCheckbox>
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
