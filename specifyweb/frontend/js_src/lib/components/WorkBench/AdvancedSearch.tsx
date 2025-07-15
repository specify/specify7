/**
 * Search Config options dialog in WB
 *
 * @module
 */

import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { getCache, setCache } from '../../utils/cache';
import { H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

type NavigationDirection = 'columnFirst' | 'rowFirst';
type ReplaceMode = 'replaceAll' | 'replaceNext';

export type WbSearchPreferences = {
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

const defaultSearchPreferences = {
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
} as const;

/**
 * Fetch cached search config or create a new one
 */
export const getInitialSearchPreferences = (): WbSearchPreferences =>
  getCache('workbench', 'searchProperties') ?? defaultSearchPreferences;

function CheckboxLine({
  children: label,
  property,
  state,
  setState,
}: {
  readonly children: string;
  readonly property: keyof WbSearchPreferences['search'];
  readonly state: WbSearchPreferences;
  readonly setState: (state: WbSearchPreferences) => void;
}): JSX.Element {
  return (
    <Label.Inline>
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
    </Label.Inline>
  );
}

function PreferencesDialog({
  searchPreferences,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly searchPreferences: WbSearchPreferences;
  readonly onChange: (newSearchPreferences: WbSearchPreferences) => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={commonText.close()}
      className={{
        container: dialogClassNames.narrowContainer,
      }}
      header={wbText.configureSearchReplace()}
      modal={false}
      onClose={handleClose}
    >
      <div>
        <H2>{wbText.navigationOptions()}</H2>
        <Label.Block>
          {wbText.cursorPriority()}
          <Select
            value={searchPreferences.navigation.direction}
            onValueChange={(value): void =>
              handleChange({
                ...searchPreferences,
                navigation: {
                  ...searchPreferences.navigation,
                  direction: value as NavigationDirection,
                },
              })
            }
          >
            <option value="columnFirst">{wbText.columnFirst()}</option>
            <option value="rowFirst">{wbText.rowFirst()}</option>
          </Select>
        </Label.Block>
      </div>

      <div className="flex flex-col">
        <H2>{wbText.searchOptions()}</H2>
        <CheckboxLine
          property="fullMatch"
          setState={handleChange}
          state={searchPreferences}
        >
          {wbText.findEntireCellsOnly()}
        </CheckboxLine>
        <CheckboxLine
          property="caseSensitive"
          setState={handleChange}
          state={searchPreferences}
        >
          {wbText.matchCase()}
        </CheckboxLine>
        <CheckboxLine
          property="useRegex"
          setState={handleChange}
          state={searchPreferences}
        >
          {wbText.useRegularExpression()}
        </CheckboxLine>
        <CheckboxLine
          property="liveUpdate"
          setState={handleChange}
          state={searchPreferences}
        >
          {wbText.liveUpdate()}
        </CheckboxLine>
      </div>

      <div>
        <H2>{wbText.replaceOptions()}</H2>
        <Label.Block>
          {wbText.replaceMode()}
          <Select
            value={searchPreferences.replace.replaceMode}
            onValueChange={(value): void =>
              handleChange({
                ...searchPreferences,
                replace: {
                  ...searchPreferences.replace,
                  replaceMode: value as ReplaceMode,
                },
              })
            }
          >
            <option value="replaceAll">{wbText.replaceAll()}</option>
            <option value="replaceNext">{wbText.replaceNext()}</option>
          </Select>
        </Label.Block>
      </div>
    </Dialog>
  );
}

export function WbAdvancedSearch({
  onChange: handleChange,
  initialSearchPreferences,
}: {
  readonly initialSearchPreferences: WbSearchPreferences;
  readonly onChange: (newSearchPreferences: WbSearchPreferences) => void;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();
  const [searchPreferences, setSearchPreferences] =
    React.useState<WbSearchPreferences>(initialSearchPreferences);

  React.useEffect(() => {
    handleChange(searchPreferences);
    setCache('workbench', 'searchProperties', searchPreferences);
  }, [searchPreferences]);

  return (
    <ErrorBoundary dismissible>
      <Button.Small
        aria-haspopup="dialog"
        aria-label={wbText.configureSearchReplace()}
        aria-pressed={isOpen}
        title={wbText.configureSearchReplace()}
        onClick={handleToggle}
      >
        {icons.cog}
      </Button.Small>
      {isOpen && (
        <PreferencesDialog
          searchPreferences={searchPreferences}
          onChange={setSearchPreferences}
          onClose={handleClose}
        />
      )}
    </ErrorBoundary>
  );
}
