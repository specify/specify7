import React from 'react';
import { ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import * as cache from '../wbplanviewcache';

interface Props {
  initialSearchPreferences: SearchPreferences;
  onChange: (newSearchPreferences: SearchPreferences) => void;
  onClose: () => void;
}

type ComponentProps = Readonly<Props>;

type ReplaceMode = 'replaceAll' | 'replaceNext';

export interface SearchPreferences {
  readonly search: {
    // Find entire cells only
    readonly fullMatch: boolean;
    // Match case
    readonly caseSensitive: boolean;
    // Use Regex
    readonly useRegex: boolean;
  };
  readonly replace: {
    readonly replaceMode: ReplaceMode;
  };
}

export const getInitialSearchPreferences = (): SearchPreferences =>
  cache.get<SearchPreferences>('workbench', 'search-properties', {
    defaultValue: {
      search: {
        fullMatch: true,
        caseSensitive: true,
        useRegex: false,
      },
      replace: {
        replaceMode: 'replaceAll',
      },
    },
  });

function WbAdvancedSearch({
  onClose: handleClose,
  onChange: handleChange,
  initialSearchPreferences,
}: ComponentProps): JSX.Element {
  const [state, setState] = React.useState<SearchPreferences>(
    initialSearchPreferences
  );

  handleChange(state);

  return (
    <ModalDialog
      onCloseCallback={handleClose}
      properties={{
        title: 'Configure Search & Replace',
        close: (): void => {
          cache.set<SearchPreferences>(
            'workbench',
            'search-properties',
            state,
            {
              overwrite: true,
            }
          );
          handleClose();
        },
        modal: false,
      }}
    >
      <b>Search Options</b>
      <br />
      <label>
        <input
          type="checkbox"
          checked={state.search.fullMatch}
          onChange={(): void =>
            setState({
              ...state,
              search: {
                ...state.search,
                fullMatch: !state.search.fullMatch,
              },
            })
          }
        />{' '}
        Find entire cells only
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={state.search.caseSensitive}
          onChange={(): void =>
            setState({
              ...state,
              search: {
                ...state.search,
                caseSensitive: !state.search.caseSensitive,
              },
            })
          }
        />{' '}
        Match case
      </label>
      <br />
      <label>
        <input
          type="checkbox"
          checked={state.search.useRegex}
          onChange={(): void =>
            setState({
              ...state,
              search: {
                ...state.search,
                useRegex: !state.search.useRegex,
              },
            })
          }
        />{' '}
        Use Regex
      </label>
      <br />
      <br />

      <b>Replace Options</b>
      <br />
      <label>
        Replace mode:
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
          <option value="replaceAll">Replace all matches</option>
          <option value="replaceNext">Replace next occurrence</option>
        </select>
      </label>
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
