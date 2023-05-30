import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { resourcesText } from '../../localization/resources';
import type { RA } from '../../utils/types';
import { toggleItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Dialog } from '../Molecules/Dialog';
import {
  allAppResources,
  countAppResources,
  defaultAppResourceFilters,
  isAllAppResourceTypes,
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

  const showAllResources = isAllAppResourceTypes(filters.appResources);
  const handleToggleResources = (): void =>
    setFilters({
      ...filters,
      appResources: showAllResources ? [] : allAppResources,
    });

  const [isOpen, handleOpen, handleClose] = useBooleanState();

  return (
    <>
      <RadioContainer screenReaderLabel={resourcesText.filters()}>
        <RadioButton
          isPressed={filters.viewSets}
          onClick={(): void =>
            setFilters({
              viewSets: showAllResources ? true : !filters.viewSets,
              appResources: [],
            })
          }
        >
          {resourcesText.formDefinitions()}
        </RadioButton>
        <RadioButton
          isPressed={showAllResources}
          onClick={(): void =>
            setFilters({
              viewSets: false,
              appResources:
                filters.viewSets || !showAllResources ? allAppResources : [],
            })
          }
        >
          {resourcesText.appResources()}
        </RadioButton>
        <Button.Info
          aria-label={resourcesText.custom()}
          title={resourcesText.custom()}
          onClick={handleOpen}
        >
          {icons.cog}
        </Button.Info>
      </RadioContainer>
      {isOpen && (
        <Dialog
          buttons={commonText.close()}
          header={resourcesText.custom()}
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
                  onValueChange={handleToggleResources}
                />
                {appResourceTypes.appResources.icon}
                {commonText.countLine({
                  resource: resourcesText.appResources(),
                  count: countAppResources(initialResources, {
                    appResources: allAppResources,
                    viewSets: false,
                  }),
                })}
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

function RadioContainer({
  screenReaderLabel,
  children,
}: {
  readonly screenReaderLabel: LocalizedString;
  readonly children: RA<JSX.Element>;
}): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2 rounded bg-[color:var(--background)]">
      <span className="sr-only">{screenReaderLabel}</span>
      {children}
    </div>
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

function RadioButton({
  isPressed,
  children,
  onClick: handleClick,
}: {
  readonly isPressed: boolean;
  readonly children: LocalizedString;
  readonly onClick: () => void;
}): JSX.Element {
  return (
    // REFACTOR: this should reuse Button.Small
    <button
      aria-pressed={isPressed}
      className={radioButtonClassName(isPressed)}
      type="button"
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
