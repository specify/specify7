import React from 'react';
import type { State } from 'typesafe-reducer';
import { generateReducer } from 'typesafe-reducer';
import type { MatchBehaviors } from '../uploadplantomappingstree';
import * as cache from '../wbplanviewcache';
import type { LoadingStates } from '../wbplanviewloadingreducer';
import { loadingStateDispatch } from '../wbplanviewloadingreducer';
import dataModelStorage from '../wbplanviewmodel';
import type {
  OpenMappingScreenAction,
  WBPlanViewActions,
} from '../wbplanviewreducer';
import type { RefActions, RefStates } from '../wbplanviewrefreducer';
import { getRefMappingState } from '../wbplanviewrefreducer';
import { Icon } from './customselectelement';
import { LoadingScreen, ModalDialog } from './modaldialog';
import type { IR, WBPlanViewProps } from './wbplanview';
import { ListOfBaseTables } from './wbplanviewcomponents';
import { HeaderWrapper, WBPlanViewHeader } from './wbplanviewheader';
import type {
  AutomapperSuggestion,
  MappingPath,
  WBPlanViewMapperBaseProps,
} from './wbplanviewmapper';
import WBPlanViewMapper from './wbplanviewmapper';
import { defaultMappingViewHeight } from './wbplanviewmappercomponents';
import { WbsDialog } from './wbsdialog';

// States

export interface LoadingState extends State<'LoadingState'> {
  readonly loadingState?: LoadingStates;
  readonly dispatchAction?: WBPlanViewActions;
}

interface BaseTableSelectionState extends State<'BaseTableSelectionState'> {
  readonly showHiddenTables: boolean;
}

type TemplateSelectionState = State<'TemplateSelectionState'>;

export interface MappingState
  extends State<'MappingState'>,
    WBPlanViewMapperBaseProps {
  readonly automapperSuggestionsPromise?: Promise<AutomapperSuggestion[]>;
  readonly changesMade: boolean;
  readonly mappingsAreValidated: boolean;
  readonly displayMatchingOptionsDialog: boolean;
  readonly mustMatchPreferences: IR<boolean>;
}

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
  showHiddenFields: cache.get<boolean>('ui', 'showHiddenFields'),
  showMappingView: cache.get<boolean>('ui', 'showMappingView', {
    defaultValue: true,
  }),
  baseTableName: '',
  newHeaderId: 1,
  mappingView: ['0'],
  mappingsAreValidated: false,
  validationResults: [],
  lines: [],
  changesMade: false,
  displayMatchingOptionsDialog: false,
  mustMatchPreferences: {},
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
    <HeaderWrapper
      stateName={state.type}
      readonly={state.props.readonly}
      header={
        <WBPlanViewHeader
          title="Select Base Table"
          stateType={state.type}
          buttonsLeft={
            <label>
              <input
                type="checkbox"
                checked={state.showHiddenTables}
                onChange={(): void =>
                  state.dispatch({
                    type: 'ToggleHiddenTablesAction',
                  })
                }
              />
              Show Advanced Tables
            </label>
          }
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
    >
      <ListOfBaseTables
        listOfTables={dataModelStorage.listOfBaseTables}
        showHiddenTables={state.showHiddenTables}
        handleChange={(tableName: string): void =>
          state.dispatch({
            type: 'SelectTableAction',
            tableName,
            mappingIsTemplated: state.props.mappingIsTemplated,
            headers: state.props.headers,
          })
        }
      />
    </HeaderWrapper>
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
      refObject.current.mappingViewHeight = cache.get<number>(
        'ui',
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
      <HeaderWrapper
        stateName={state.type}
        readonly={state.props.readonly}
        header={
          <WBPlanViewHeader
            title={
              dataModelStorage.tables[state.baseTableName].tableFriendlyName
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
              )
            }
            buttonsRight={
              <>
                {!state.showMappingView && (
                  <button
                    type="button"
                    onClick={(): void =>
                      state.dispatch({
                        type: 'ToggleMappingViewAction',
                        isVisible: true,
                      })
                    }
                  >
                    Show Mapping View
                  </button>
                )}
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
                      onClick={(): void => {
                        state.dispatch({
                          type: 'ValidationAction',
                        });
                        state.refObjectDispatch({
                          type: 'AutoscrollStatusChangeAction',
                          autoscrollType: 'mappingView',
                          status: true,
                        });
                      }}
                    >
                      Check Mappings
                      {state.mappingsAreValidated && (
                        <i
                          style={{
                            color: '#4f2',
                            fontSize: '12px',
                          }}
                        >
                          ✓
                        </i>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(): void => {
                        handleSave(false);
                        state.refObjectDispatch({
                          type: 'AutoscrollStatusChangeAction',
                          autoscrollType: 'mappingView',
                          status: true,
                        });
                      }}
                    >
                      Save
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
              </>
            }
          />
        }
        handleClick={handleClose}
      >
        {!refObject.current.hideEmptyDataSetDialogAction &&
          state.props.headers.length === 0 && (
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
                Press the &quot;Add New Column&quot; button at the bottom of the
                screen to add new columns.
              </span>
            </ModalDialog>
          )}
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
          handleClearMapping={(line: number): void =>
            state.dispatch({
              type: 'ClearMappingLineAction',
              line,
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
          handleAutoscrollStatusChange={(autoscrollType, status): void =>
            state.refObjectDispatch({
              type: 'AutoscrollStatusChangeAction',
              autoscrollType,
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
        {state.displayMatchingOptionsDialog ? (
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
                          <label>
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
            )}
          </ModalDialog>
        ) : null}
      </HeaderWrapper>
    );
  },
});
