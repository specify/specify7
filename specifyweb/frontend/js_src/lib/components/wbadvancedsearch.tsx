import React from 'react';

import * as cache from '../cache';
import wbText from '../localization/workbench';
import { ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';

interface Props {
  initialSearchPreferences: SearchPreferences;
  onChange: (newSearchPreferences: SearchPreferences) => void;
  onClose: () => void;
}

type ComponentProps = Readonly<Props>;

type NavigationDirection = 'columnFirst' | 'rowFirst';
type ReplaceMode = 'replaceAll' | 'replaceNext';

export interface SearchPreferences {
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
     * Live Updated
     * Whether to check newly changed cells for search query matches
     */
    readonly liveUpdate: boolean;
  };
  readonly replace: {
    readonly replaceMode: ReplaceMode;
  };
}

const CACHE_VERSION = '1';

export const getInitialSearchPreferences = (): SearchPreferences =>
  cache.get('workbench', 'search-properties', {
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

function Checkbox({
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
    <label>
      <input
        type="checkbox"
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
      <br />
    </label>
  );
}

function WbAdvancedSearch({
  onClose: handleClose,
  onChange: handleChange,
  initialSearchPreferences,
}: ComponentProps): JSX.Element {
  const [state, setState] = React.useState<SearchPreferences>(
    initialSearchPreferences
  );

  handleChange(state);

  cache.set('workbench', 'search-properties', state, {
    overwrite: true,
    version: CACHE_VERSION,
  });

  return (
    <ModalDialog
      onCloseCallback={handleClose}
      properties={{
        title: wbText('wbAdvancedSearchDialogTitle'),
        close: handleClose,
        modal: false,
      }}
    >
      <>
        <b>{wbText('navigationOptions')}</b>
        <br />
        <label>
          {wbText('cursorPriority')}
          <br />
          <select
            onChange={({ target }): void =>
              setState({
                ...state,
                navigation: {
                  ...state.navigation,
                  direction: target.value as NavigationDirection,
                },
              })
            }
            value={state.navigation.direction}
          >
            <option value="columnFirst">{wbText('columnFirst')}</option>
            <option value="rowFirst">{wbText('rowFirst')}</option>
          </select>
        </label>
        <br />
        <br />

        <b>{wbText('searchOptions')}</b>
        <br />
        <Checkbox property="fullMatch" state={state} setState={setState}>
          {wbText('findEntireCellsOnly')}
        </Checkbox>
        <Checkbox property="caseSensitive" state={state} setState={setState}>
          {wbText('matchCase')}
        </Checkbox>
        <Checkbox property="useRegex" state={state} setState={setState}>
          {wbText('useRegularExpression')}
        </Checkbox>
        <Checkbox property="liveUpdate" state={state} setState={setState}>
          {wbText('liveUpdate')}
        </Checkbox>
        <br />

        <b>{wbText('replaceOptions')}</b>
        <br />
        <label>
          {wbText('replaceMode')}
          <br />
          <select
            onChange={({ target }): void =>
              setState({
                ...state,
                replace: {
                  ...state.replace,
                  replaceMode: target.value as ReplaceMode,
                },
              })
            }
            value={state.replace.replaceMode}
          >
            <option value="replaceAll">{wbText('replaceAll')}</option>
            <option value="replaceNext">{wbText('replaceNext')}</option>
          </select>
        </label>
      </>
    </ModalDialog>
  );
}

export default createBackboneView<Props, Props, ComponentProps>({
  moduleName: 'WbAdvancedSearch',
  className: 'wb-advanced-search',
  initialize(self, { initialSearchPreferences, onChange, onClose }) {
    self.initialSearchPreferences = initialSearchPreferences;
    self.onChange = onChange;
    self.onClose = onClose;
  },
  Component: WbAdvancedSearch,
  getComponentProps: (self) => ({
    onClose: (): void => {
      self.onClose();
      self.remove();
    },
    initialSearchPreferences: self.initialSearchPreferences,
    onChange: self.onChange,
  }),
});
