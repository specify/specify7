import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';

import * as cache from '../cache';
import type { MatchBehaviors } from '../uploadplantomappingstree';
import type { LoadingStates } from '../wbplanviewloadingreducer';
import { loadingStateDispatch } from '../wbplanviewloadingreducer';
import dataModelStorage from '../wbplanviewmodel';
import type {
  OpenMappingScreenAction,
  WBPlanViewActions,
} from '../wbplanviewreducer';
import type { RefActions, RefStates } from '../wbplanviewrefreducer';
import { getRefMappingState } from '../wbplanviewrefreducer';
import { mappingPathIsComplete } from '../wbplanviewutils';
import { Icon } from './customselectelement';
import { LoadingScreen, ModalDialog } from './modaldialog';
import type { RA, WBPlanViewProps } from './wbplanview';
import { ListOfBaseTables } from './wbplanviewcomponents';
import { Layout, WBPlanViewHeader } from './wbplanviewheader';
import type {
  AutomapperSuggestion,
  MappingPath,
  WBPlanViewMapperBaseProps,
} from './wbplanviewmapper';
import WBPlanViewMapper from './wbplanviewmapper';
import { defaultMappingViewHeight } from './wbplanviewmappercomponents';
import { WbsDialog } from './wbsdialog';

// States

export type LoadingState = State<
  'LoadingState',
  {
    loadingState?: LoadingStates;
    dispatchAction?: WBPlanViewActions;
  }
>;

type BaseTableSelectionState = State<
  'BaseTableSelectionState',
  {
    showHiddenTables: boolean;
  }
>;

type TemplateSelectionState = State<'TemplateSelectionState'>;

export type MappingState = State<
  'MappingState',
  WBPlanViewMapperBaseProps & {
    automapperSuggestionsPromise?: Promise<RA<AutomapperSuggestion>>;
    changesMade: boolean;
    mappingsAreValidated: boolean;
    displayMatchingOptionsDialog: boolean;
    showAutomapperDialog: boolean;
    showInvalidValidationDialog: boolean;
  }
>;

export type WBPlanViewStates =
  | BaseTableSelectionState
  | LoadingState
  | TemplateSelectionState
  | MappingState;

type WBPlanViewStatesWithParameters = WBPlanViewStates & {
  readonly dispatch: (action: WBPlanViewActions) => void;
  readonly props: WBPlanViewProps;
  readonly refObject: React.MutableRefObject<RefStates>;
  readonly refObjectDispatch: (action: RefActions) => void;
};

export const getInitialWBPlanViewState = (
  props: OpenMappingScreenAction
): WBPlanViewStates => ({
  type: 'LoadingState',
  dispatchAction: props.uploadPlan
    ? {
        ...props,
        type: 'OpenMappingScreenAction',
      }
    : {
        type: 'OpenBaseTableSelectionAction',
      },
});

export function mappingState(state: WBPlanViewStates): MappingState {
  if (state.type === 'MappingState') return state;
  else
    throw new Error(
      'Dispatching this action requires the state ' +
        'to be of type `MappingState`'
    );
}

export const getDefaultMappingState = (): MappingState => ({
  type: 'MappingState',
  mappingIsTemplated: false,
  showHiddenFields: cache.get('wbplanview-ui', 'showHiddenFields'),
  showMappingView: cache.get('wbplanview-ui', 'showMappingView', {
    defaultValue: true,
  }),
  baseTableName: '',
  newHeaderId: 1,
  mappingView: ['0'],
  mappingsAreValidated: false,
  validationResults: [],
  lines: [],
  focusedLine: 0,
  changesMade: false,
  displayMatchingOptionsDialog: false,
  mustMatchPreferences: {},
  showAutomapperDialog: false,
  showInvalidValidationDialog: false,
});

export const stateReducer = generateReducer<
  JSX.Element,
  WBPlanViewStatesWithParameters
>({
  LoadingState: ({ action: state }) => {
    if (typeof state.loadingState !== 'undefined')
      Promise.resolve('')
        .then(() => loadingStateDispatch(state.loadingState!))
        .catch((error) => {
          throw error;
        });
    if (typeof state.dispatchAction !== 'undefined')
      state.dispatch(state.dispatchAction);
    return <LoadingScreen />;
  },
  BaseTableSelectionState: ({ action: state }) => (
    <Layout
      stateName={state.type}
      readonly={state.props.readonly}
      header={
        <WBPlanViewHeader
          title="Select Base Table"
          stateType={state.type}
          buttonsLeft={undefined}
          buttonsRight={
            <>
              <button
                type="button"
                onClick={(): void =>
                  state.dispatch({
                    type: 'UseTemplateAction',
                    dispatch: state.dispatch,
                  })
                }
              >
                Choose Existing Plan
              </button>
              <button
                type="button"
                onClick={(): void =>
                  state.dispatch({
                    type: 'CancelMappingAction',
                    dataset: state.props.dataset,
                    removeUnloadProtect: state.props.removeUnloadProtect,
                  })
                }
              >
                Cancel
              </button>
            </>
          }
        />
      }
      footer={
        <label>
          <input
            type="checkbox"
            checked={state.showHiddenTables}
            onChange={(): void =>
              state.dispatch({
                type: 'ToggleHiddenTablesAction',
              })
            }
          />{' '}
          Show Advanced Tables
        </label>
      }
    >
      <ListOfBaseTables
        listOfTables={dataModelStorage.listOfBaseTables}
        showHiddenTables={state.showHiddenTables}
        handleChange={(baseTableName: string): void =>
          state.dispatch({
            type: 'SelectTableAction',
            baseTableName,
            mappingIsTemplated: state.props.mappingIsTemplated,
            headers: state.props.headers,
          })
        }
      />
    </Layout>
  ),
  TemplateSelectionState: ({ action: state }) => (
    <WbsDialog
      showTemplates={true}
      onClose={() =>
        state.dispatch({
          type: 'OpenBaseTableSelectionAction',
          referrer: state.type,
        })
      }
      onDataSetSelect={(id: number) =>
        state.refObjectDispatch({
          type: 'TemplateSelectedAction',
          id,
        })
      }
    />
  ),
  MappingState: ({ action: state }) => {
    const refObject = getRefMappingState(state.refObject, state);

    if (typeof refObject.current.mappingViewHeight === 'undefined')
      refObject.current.mappingViewHeight = cache.get(
        'wbplanview-ui',
        'mappingViewHeight',
        {
          defaultValue: defaultMappingViewHeight,
        }
      );

    const handleSave = (ignoreValidation: boolean): void =>
      state.dispatch({
        type: 'SavePlanAction',
        dataset: state.props.dataset,
        removeUnloadProtect: state.props.removeUnloadProtect,
        setUnloadProtect: state.props.setUnloadProtect,
        mappingIsTemplated: state.mappingIsTemplated,
        ignoreValidation,
      });
    const handleClose = (): void =>
      state.dispatch({
        type: 'CloseSelectElementAction',
      });
    const handleMappingOptionsDialogClose = (): void =>
      state.dispatch({
        type: 'CloseMatchingLogicDialogAction',
      });

    return (
      <Layout
        stateName={state.type}
        readonly={state.props.readonly}
        header={
          <WBPlanViewHeader
            title={
              <>
                Base table:{' '}
                <b>
                  {
                    dataModelStorage.tables[state.baseTableName]
                      .tableFriendlyName
                  }
                </b>
              </>
            }
            stateType={state.type}
            buttonsLeft={
              state.props.readonly ? (
                <span
                  className="wbplanview-readonly-badge"
                  title={`
                  You are viewing the mappings for an uploaded dataset.
                  To edit the mappings, un-upload the dataset or create a new
                  dataset
                `}
                >
                  (Read-Only Mode)
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={(): void =>
                      state.dispatch({
                        type: 'OpenBaseTableSelectionAction',
                      })
                    }
                  >
                    Change Table
                  </button>
                  <button
                    type="button"
                    onClick={(): void =>
                      mappingState(state).lines.length === 0 ||
                      mappingState(state).lines.every(
                        ({ mappingPath }) => !mappingPathIsComplete(mappingPath)
                      )
                        ? state.dispatch({
                            type: 'SelectTableAction',
                            headers: state.props.headers,
                            baseTableName: state.baseTableName,
                            mappingIsTemplated: state.props.mappingIsTemplated,
                          })
                        : state.dispatch({
                            type: 'RerunAutomapperAction',
                          })
                    }
                  >
                    Rerun Automapper
                  </button>
                </>
              )
            }
            buttonsRight={
              <>
                <button
                  type="button"
                  onClick={(): void =>
                    state.dispatch({
                      type: 'ToggleMappingViewAction',
                      isVisible: !state.showMappingView,
                    })
                  }
                >
                  {state.showMappingView ? 'Hide' : 'Show'} Mapping View
                </button>
                <button
                  type="button"
                  onClick={(): void =>
                    state.dispatch({
                      type: 'OpenMatchingLogicDialogAction',
                    })
                  }
                >
                  Matching Logic
                </button>
                {!state.props.readonly && (
                  <>
                    <button
                      type="button"
                      onClick={(): void =>
                        state.dispatch({
                          type: 'ResetMappingsAction',
                        })
                      }
                    >
                      Clear Mappings
                    </button>
                    <button
                      type="button"
                      className={`validation-indicator ${
                        state.mappingsAreValidated
                          ? 'validation-indicator-success'
                          : ''
                      }`}
                      onClick={(): void => {
                        state.dispatch({
                          type: 'ValidationAction',
                        });
                        state.refObjectDispatch({
                          type: 'AutoScrollStatusChangeAction',
                          autoScrollType: 'mappingView',
                          status: true,
                        });
                      }}
                    >
                      Validate Mappings
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={(): void =>
                    state.dispatch({
                      type: 'CancelMappingAction',
                      dataset: state.props.dataset,
                      removeUnloadProtect: state.props.removeUnloadProtect,
                    })
                  }
                >
                  {state.props.readonly ? 'Return back' : 'Cancel'}
                </button>
                {!state.props.readonly && (
                  <button
                    type="button"
                    onClick={(): void => {
                      handleSave(false);
                      state.refObjectDispatch({
                        type: 'AutoScrollStatusChangeAction',
                        autoScrollType: 'mappingView',
                        status: true,
                      });
                    }}
                  >
                    Save
                  </button>
                )}
              </>
            }
          />
        }
        handleClick={handleClose}
      >
        <WBPlanViewMapper
          mappingIsTemplated={state.mappingIsTemplated}
          showHiddenFields={state.showHiddenFields}
          showMappingView={state.showMappingView}
          baseTableName={state.baseTableName}
          newHeaderId={state.newHeaderId}
          lines={state.lines}
          mappingView={state.mappingView}
          validationResults={state.validationResults}
          mapperDispatch={state.dispatch}
          openSelectElement={state.openSelectElement}
          automapperSuggestions={state.automapperSuggestions}
          focusedLine={state.focusedLine}
          refObject={refObject}
          readonly={state.props.readonly}
          mustMatchPreferences={state.mustMatchPreferences}
          handleSave={(): void => handleSave(true)}
          handleToggleHiddenFields={(): void =>
            state.dispatch({ type: 'ToggleHiddenFieldsAction' })
          }
          handleFocus={(line: number): void =>
            state.dispatch({
              type: 'FocusLineAction',
              line,
            })
          }
          handleMappingViewMap={(): void =>
            state.dispatch({ type: 'MappingViewMapAction' })
          }
          handleAddNewHeader={(): void =>
            state.dispatch({ type: 'AddNewHeaderAction' })
          }
          handleOpen={(line: number, index: number): void =>
            state.dispatch({
              type: 'OpenSelectElementAction',
              line,
              index,
            })
          }
          handleClose={handleClose}
          handleChange={(
            line: 'mappingView' | number,
            index: number,
            value: string,
            isRelationship: boolean,
            currentTableName: string,
            newTableName: string
          ): void =>
            state.dispatch({
              type: 'ChangeSelectElementValueAction',
              line,
              index,
              value,
              isRelationship,
              currentTableName,
              newTableName,
            })
          }
          handleAutomapperSuggestionSelection={(suggestion: string): void =>
            state.dispatch({
              type: 'AutomapperSuggestionSelectedAction',
              suggestion,
            })
          }
          handleValidationResultClick={(mappingPath: MappingPath): void =>
            state.dispatch({
              type: 'ValidationResultClickAction',
              mappingPath,
            })
          }
          handleToggleMappingIsTemplated={(): void =>
            state.dispatch({
              type: 'ToggleMappingIsTemplatedAction',
            })
          }
          handleMappingViewResize={(height): void =>
            state.refObjectDispatch({
              type: 'MappingViewResizeAction',
              height,
            })
          }
          handleAutoScrollStatusChange={(autoScrollType, status): void =>
            state.refObjectDispatch({
              type: 'AutoScrollStatusChangeAction',
              autoScrollType,
              status,
            })
          }
          handleChangeMatchBehaviorAction={(
            line: number,
            matchBehavior: MatchBehaviors
          ): void =>
            state.dispatch({
              type: 'ChangeMatchBehaviorAction',
              line,
              matchBehavior,
            })
          }
          handleToggleAllowNullsAction={(
            line: number,
            allowNull: boolean
          ): void =>
            state.dispatch({
              type: 'ToggleAllowNullsAction',
              line,
              allowNull,
            })
          }
          handleChangeDefaultValue={(
            line: number,
            defaultValue: string | null
          ): void =>
            state.dispatch({
              type: 'ChangeDefaultValue',
              line,
              defaultValue,
            })
          }
        />
        <div style={{ position: 'absolute' }}>
          {!refObject.current.hideEmptyDataSetDialogAction &&
            state.lines.length === 0 && (
              <ModalDialog
                onCloseCallback={() =>
                  state.refObjectDispatch({
                    type: 'RefHideEmptyDataSetDialogAction',
                  })
                }
                properties={{
                  title: 'Empty Data Set detected',
                }}
              >
                <span>
                  This Data Set doesn&apos;t have any columns.
                  <br />
                  Press the &quot;Add New Column&quot; button at the bottom of
                  the screen to add new columns.
                </span>
              </ModalDialog>
            )}
          {state.showAutomapperDialog && (
            <ModalDialog
              onCloseCallback={() =>
                state.dispatch({
                  type: 'CancelRerunAutomapperAction',
                })
              }
              properties={{
                title: 'Rerun Automapper?',
                buttons: {
                  'Rerun Automapper': () =>
                    state.dispatch({
                      type: 'SelectTableAction',
                      headers: state.props.headers,
                      baseTableName: state.baseTableName,
                      mappingIsTemplated: state.props.mappingIsTemplated,
                    }),
                  Cancel: () =>
                    state.dispatch({
                      type: 'CancelRerunAutomapperAction',
                    }),
                },
              }}
            >
              The Automapper will erase all of your current mappings. Confirm?
            </ModalDialog>
          )}
          {state.showInvalidValidationDialog && (
            <ModalDialog
              onCloseCallback={() =>
                state.dispatch({
                  type: 'CloseInvalidValidationDialogAction',
                })
              }
              properties={{
                title: 'Nothing to validate',
                buttons: {
                  Close: () =>
                    state.dispatch({
                      type: 'CloseInvalidValidationDialogAction',
                    }),
                },
              }}
            >
              <>Please map some headers before running the validation.</>
            </ModalDialog>
          )}
          {state.displayMatchingOptionsDialog && (
            <ModalDialog
              onCloseCallback={handleMappingOptionsDialogClose}
              properties={{
                title: 'Change Matching Logic',
                buttons: {
                  Done: handleMappingOptionsDialogClose,
                },
              }}
            >
              {Object.keys(state.mustMatchPreferences).length === 0 ? (
                'Matching logic is unavailable for current mappings'
              ) : (
                <>
                  <h4 style={{ paddingLeft: '4px' }}>
                    Require Data to Match Existing Records
                  </h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Table Name</th>
                        <th>Must Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(state.mustMatchPreferences).map(
                        ([tableName, mustMatch]) => (
                          <tr key={tableName}>
                            <td>
                              <div className="must-match-line">
                                <Icon
                                  tableName={tableName}
                                  optionLabel={tableName}
                                  isRelationship={true}
                                />
                                {
                                  dataModelStorage.tables[tableName]
                                    .tableFriendlyName
                                }
                              </div>
                            </td>
                            <td>
                              <label
                                style={{
                                  display: 'block',
                                  textAlign: 'center',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={mustMatch}
                                  {...(state.props.readonly
                                    ? {
                                        disabled: true,
                                      }
                                    : {
                                        onChange: (): void =>
                                          state.dispatch({
                                            type: 'MustMatchPrefChangeAction',
                                            tableName,
                                            mustMatch: !mustMatch,
                                          }),
                                      })}
                                />
                              </label>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </ModalDialog>
          )}
        </div>
      </Layout>
    );
  },
});
