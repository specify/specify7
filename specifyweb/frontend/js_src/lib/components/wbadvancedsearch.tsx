/**
 * Search Config options dialog in WB
 *
 * @module
 */

import React from 'react';

import { commonText } from '../localization/common';
import { wbText } from '../localization/workbench';
import { Button, H2, Input, Label, Select } from './basic';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames } from './modaldialog';
import { getCache, setCache } from '../cache';

type NavigationDirection = 'columnFirst' | 'rowFirst';
type ReplaceMode = 'replaceAll' | 'replaceNext';

export type SearchPreferences = {
  readonly navigation: {
    readonly direction: NavigationDirection;
  };
  readonly search: {
    // Find entire cells only
    readonly fullMatch: boolean;
    // Match case
    readonly caseSensitive: boolean;
    // Use Regex
    readonly useRegex: boolean;
    /*
     * Whether to check newly changed cells for search query matches
     * And whether to rerun search as soon as SearchPreferences are changed
     */
    readonly liveUpdate: boolean;
  };
  readonly replace: {
    readonly replaceMode: ReplaceMode;
  };
};

const CACHE_VERSION = '1';

/**
 * Fetch cached search config or create a new one
 */
export const getInitialSearchPreferences = (): SearchPreferences =>
  getCache('workbench', 'searchProperties', {
    defaultValue: {
      navigation: {
        direction: 'columnFirst',
      },
      search: {
        fullMatch: true,
        caseSensitive: true,
        useRegex: false,
        liveUpdate: true,
      },
      replace: {
        replaceMode: 'replaceAll',
      },
    },
    version: CACHE_VERSION,
  });

function CheckboxLine({
  children: label,
  property,
  state,
  setState,
}: {
  readonly children: string;
  readonly property: keyof SearchPreferences['search'];
  readonly state: SearchPreferences;
  readonly setState: (state: SearchPreferences) => void;
}): JSX.Element {
  return (
    <Label.ForCheckbox>
      <Input.Checkbox
        checked={state.search[property]}
        onChange={(): void =>
          setState({
            ...state,
            search: {
              ...state.search,
              [property]: !state.search[property],
            },
          })
        }
      />
      {` ${label}`}
    </Label.ForCheckbox>
  );
}

function PreferencesDialog({
  searchPreferences,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly searchPreferences: SearchPreferences;
  readonly onChange: (newSearchPreferences: SearchPreferences) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      header={wbText('wbAdvancedSearchDialogTitle')}
      onClose={handleClose}
      buttons={commonText('close')}
      modal={false}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
    >
      <div>
        <H2>{wbText('navigationOptions')}</H2>
        <Label.Generic>
          {wbText('cursorPriority')}
          <Select
            onValueChange={(value): void =>
              handleChange({
                ...searchPreferences,
                navigation: {
                  ...searchPreferences.navigation,
                  direction: value as NavigationDirection,
                },
              })
            }
            value={searchPreferences.navigation.direction}
          >
            <option value="columnFirst">{wbText('columnFirst')}</option>
            <option value="rowFirst">{wbText('rowFirst')}</option>
          </Select>
        </Label.Generic>
      </div>

      <div className="flex flex-col">
        <H2>{wbText('searchOptions')}</H2>
        <CheckboxLine
          property="fullMatch"
          state={searchPreferences}
          setState={handleChange}
        >
          {wbText('findEntireCellsOnly')}
        </CheckboxLine>
        <CheckboxLine
          property="caseSensitive"
          state={searchPreferences}
          setState={handleChange}
        >
          {wbText('matchCase')}
        </CheckboxLine>
        <CheckboxLine
          property="useRegex"
          state={searchPreferences}
          setState={handleChange}
        >
          {wbText('useRegularExpression')}
        </CheckboxLine>
        <CheckboxLine
          property="liveUpdate"
          state={searchPreferences}
          setState={handleChange}
        >
          {wbText('liveUpdate')}
        </CheckboxLine>
      </div>

      <div>
        <H2>{wbText('replaceOptions')}</H2>
        <Label.Generic>
          {wbText('replaceMode')}
          <Select
            onValueChange={(value): void =>
              handleChange({
                ...searchPreferences,
                replace: {
                  ...searchPreferences.replace,
                  replaceMode: value as ReplaceMode,
                },
              })
            }
            value={searchPreferences.replace.replaceMode}
          >
            <option value="replaceAll">{wbText('replaceAll')}</option>
            <option value="replaceNext">{wbText('replaceNext')}</option>
          </Select>
        </Label.Generic>
      </div>
    </Dialog>
  );
}

export function WbAdvancedSearch({
  onChange: handleChange,
  initialSearchPreferences,
}: {
  readonly initialSearchPreferences: SearchPreferences;
  readonly onChange: (newSearchPreferences: SearchPreferences) => void;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const [searchPreferences, setSearchPreferences] =
    React.useState<SearchPreferences>(initialSearchPreferences);

  React.useEffect(() => {
    handleChange(searchPreferences);
    setCache('workbench', 'searchProperties', searchPreferences, {
      version: CACHE_VERSION,
    });
  }, [searchPreferences]);

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={isOpen}
        title={wbText('configureSearchReplace')}
        aria-label={wbText('configureSearchReplace')}
        onClick={handleToggle}
      >
        {icons.cog}
      </Button.Small>
      {isOpen && (
        <PreferencesDialog
          searchPreferences={searchPreferences}
          onClose={handleClose}
          onChange={setSearchPreferences}
        />
      )}
    </>
  );
}
