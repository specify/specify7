/*
 *
 * Contains WbPlanView logic for when the application is in the Mapping State
 * (when base table is selected and headers are loaded)
 *
 *
 */

import React from 'react';

import wbText from '../localization/workbench';
import type {
  ColumnOptions,
  MatchBehaviors,
} from '../uploadplantomappingstree';
import { getMappingLineData } from '../wbplanviewnavigator';
import type { MappingActions } from '../wbplanviewreducer';
import type { AutoScrollTypes, RefMappingState } from '../wbplanviewrefreducer';
import { getMappedFields, mappingPathIsComplete } from '../wbplanviewutils';
import type { IR, RA } from './wbplanview';
import type { MappingPathProps } from './wbplanviewcomponents';
import { MappingLineComponent } from './wbplanviewcomponents';
import {
  MappingsControlPanel,
  MappingView,
  minMappingViewHeight,
  ValidationResults,
} from './wbplanviewmappercomponents';

/*
 * Scope is used to differentiate between mapper definitions that should
 * be used by the automapper and suggestion boxes
 */
export type AutomapperScope =
  // Used when selecting a base table
  | 'automapper'
  // Suggestion boxes - used when opening a picklist
  | 'suggestion';
export type MappingPath = RA<string>;
export type MappingPathWritable = string[];
export type FullMappingPath = Readonly<
  [...MappingPath, MappingType, string, ColumnOptions]
>;
export type FullMappingPathWritable = [
  ...MappingPathWritable,
  MappingType,
  string,
  ColumnOptions
];
/*
 * MappingType remains here from the time when we had `NewHeader` and
 *  `NewStaticHeader`. Also, it is not removed as it might be useful in the
 *  future if we would want to add new mapping types
 *
 */
export type MappingType = 'existingHeader';
export type RelationshipType =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many';

export type SelectElementPosition = {
  readonly line: number;
  readonly index: number;
};

export interface MappingLine {
  readonly mappingType: MappingType;
  readonly headerName: string;
  readonly mappingPath: MappingPath;
  readonly columnOptions: ColumnOptions;
  readonly isFocused?: boolean;
}

export interface AutomapperSuggestion extends MappingPathProps {
  readonly mappingPath: MappingPath;
}

export type WbPlanViewMapperBaseProps = {
  readonly showHiddenFields: boolean;
  readonly showMappingView: boolean;
  readonly baseTableName: string;
  /*
   * The index that would be shown in the header name the next time the user
   * presses `New Column`
   */
  readonly newHeaderId: number;
  readonly mappingView: MappingPath;
  readonly validationResults: MappingPath[];
  readonly lines: RA<MappingLine>;
  readonly openSelectElement?: SelectElementPosition;
  readonly focusedLine: number;
  readonly automapperSuggestions?: RA<AutomapperSuggestion>;
  readonly mustMatchPreferences: IR<boolean>;
};

export default function WbPlanViewMapper(
  props: WbPlanViewMapperBaseProps & {
    readonly mapperDispatch: (action: MappingActions) => void;
    readonly refObject: React.MutableRefObject<Partial<RefMappingState>>;
    readonly handleSave: () => void;
    readonly handleFocus: (lineIndex: number) => void;
    readonly handleMappingViewMap: () => void;
    readonly handleAddNewHeader: () => void;
    readonly handleToggleHiddenFields: () => void;
    readonly readonly: boolean;
    readonly handleOpen: (line: number, index: number) => void;
    readonly handleClose: () => void;
    readonly handleChange: (
      line: 'mappingView' | number,
      index: number,
      newValue: string,
      isRelationship: boolean,
      currentTable: string,
      newTable: string,
      isDoubleClick: boolean
    ) => void;
    readonly handleClearMapping: (index: number) => void;
    readonly handleAutomapperSuggestionSelection: (suggestion: string) => void;
    readonly handleValidationResultClick: (mappingPath: MappingPath) => void;
    readonly handleDismissValidation: () => void;
    readonly handleMappingViewResize: (height: number) => void;
    readonly handleAutoScrollStatusChange: (
      autoScrollType: AutoScrollTypes,
      status: boolean
    ) => void;
    readonly handleChangeMatchBehaviorAction: (
      line: number,
      matchBehavior: MatchBehaviors
    ) => void;
    readonly handleToggleAllowNullsAction: (
      line: number,
      allowNull: boolean
    ) => void;
    readonly handleChangeDefaultValue: (
      line: number,
      defaultValue: string | null
    ) => void;
  }
): JSX.Element {
  const getMappedFieldsBind = getMappedFields.bind(undefined, props.lines);
  const listOfMappings = React.useRef<HTMLDivElement>(null);

  const mappingViewParentRef = React.useRef<HTMLDivElement | null>(null);

  // Scroll listOfMappings to the bottom when new header is added
  React.useEffect(() => {
    if (
      typeof props.refObject.current.autoScroll === 'undefined' ||
      !listOfMappings.current ||
      !mappingViewParentRef.current
    )
      return;

    (
      Object.entries(props.refObject.current.autoScroll) as [
        AutoScrollTypes,
        boolean
      ][]
    )
      .filter(([, autoScroll]) => autoScroll)
      .forEach(([autoScrollType]) => {
        if (autoScrollType === 'listOfMappings') {
          if (!listOfMappings.current) return;

          listOfMappings.current.scrollTop =
            listOfMappings.current.scrollHeight;
        }

        props.handleAutoScrollStatusChange(autoScrollType, false);
      });
  });

  // `resize` event listener for the mapping view
  React.useEffect(() => {
    if (
      typeof ResizeObserver === 'undefined' ||
      mappingViewParentRef === null ||
      !mappingViewParentRef.current
    )
      return undefined;

    const resizeObserver = new ResizeObserver(
      () =>
        mappingViewParentRef.current &&
        props.handleMappingViewResize(mappingViewParentRef.current.offsetHeight)
    );

    resizeObserver.observe(mappingViewParentRef.current);

    return (): void => resizeObserver.disconnect();
  }, [mappingViewParentRef.current]);

  // Reposition suggestions box if it doesn't fit
  function repositionSuggestionBox(): void {
    if (
      typeof props.automapperSuggestions === 'undefined' ||
      props.automapperSuggestions.length === 0
    )
      return;

    if (listOfMappings.current === null) return;

    const automapperSuggestions = listOfMappings.current.getElementsByClassName(
      'custom-select-suggestion-list'
    )[0] as HTMLElement | undefined;

    if (!automapperSuggestions) return;

    const customSelectElement = automapperSuggestions.parentElement;

    if (!customSelectElement) return;

    const automapperSuggestionsHeight = automapperSuggestions.clientHeight;

    const listOfMappingsPosition = listOfMappings.current.offsetTop;
    const currentScrollTop = listOfMappings.current.scrollTop;
    const picklistPosition = customSelectElement.offsetTop;

    // Suggestions list fits on the screen. nothing to do
    if (
      picklistPosition - listOfMappingsPosition - automapperSuggestionsHeight >=
      0
    )
      return;

    if (!automapperSuggestions.classList.contains('controlled'))
      automapperSuggestions.classList.add('controlled');

    const suggestionsListPosition =
      picklistPosition - automapperSuggestionsHeight - currentScrollTop;

    const scrollPosition =
      picklistPosition - currentScrollTop - listOfMappingsPosition;

    // Hide suggestions box once its parent picklist becomes hidden
    automapperSuggestions.style.visibility =
      scrollPosition > 0 ? 'visible' : 'hidden';

    if (scrollPosition > 0)
      automapperSuggestions.style.top = `${suggestionsListPosition}px`;
  }

  React.useEffect(repositionSuggestionBox, [
    props.automapperSuggestions,
    listOfMappings,
  ]);

  React.useEffect(() => {
    window.addEventListener('resize', repositionSuggestionBox);
    return (): void =>
      window.removeEventListener('resize', repositionSuggestionBox);
  }, []);

  return (
    <>
      {!props.readonly && props.validationResults.length > 0 && (
        <ValidationResults
          baseTableName={props.baseTableName}
          validationResults={props.validationResults}
          onSave={props.handleSave}
          onDismissValidation={props.handleDismissValidation}
          getMappedFields={getMappedFieldsBind}
          onValidationResultClick={props.handleValidationResultClick}
          mustMatchPreferences={props.mustMatchPreferences}
        />
      )}
      {props.showMappingView && (
        <section
          className="mapping-view-parent"
          style={
            {
              '--mapping-view-min-height': `${minMappingViewHeight}px`,
              '--mapping-view-height': `${
                props.refObject.current.mappingViewHeight ?? ''
              }px`,
            } as React.CSSProperties
          }
          ref={mappingViewParentRef}
        >
          <div className="mapping-view-container">
            <MappingView
              baseTableName={props.baseTableName}
              focusedLineExists={props.lines.length > 0}
              mappingPath={props.mappingView}
              showHiddenFields={props.showHiddenFields}
              mapButtonIsEnabled={
                typeof props.focusedLine !== 'undefined' &&
                mappingPathIsComplete(props.mappingView)
              }
              readonly={props.readonly}
              mustMatchPreferences={props.mustMatchPreferences}
              handleMapButtonClick={
                props.readonly ? undefined : props.handleMappingViewMap
              }
              handleMappingViewChange={
                props.readonly
                  ? undefined
                  : props.handleChange.bind(undefined, 'mappingView')
              }
              getMappedFields={getMappedFieldsBind}
            />
          </div>
        </section>
      )}

      <section
        className="mapping-line-list"
        ref={listOfMappings}
        onScroll={repositionSuggestionBox}
      >
        {props.lines.map(
          ({ mappingPath, headerName, mappingType, columnOptions }, index) => (
            <MappingLineComponent
              key={index}
              headerName={headerName}
              mappingType={mappingType}
              readonly={props.readonly}
              isFocused={index === props.focusedLine}
              handleFocus={props.handleFocus.bind(undefined, index)}
              handleClearMapping={props.handleClearMapping.bind(
                undefined,
                index
              )}
              lineData={getMappingLineData({
                baseTableName: props.baseTableName,
                mappingPath,
                generateLastRelationshipData: true,
                iterate: true,
                customSelectType: 'CLOSED_LIST',
                handleChange:
                  (!props.readonly &&
                    props.handleChange.bind(undefined, index)) ||
                  undefined,
                handleOpen: props.handleOpen.bind(undefined, index),
                handleClose: props.handleClose.bind(undefined, index),
                handleAutomapperSuggestionSelection:
                  (!props.readonly &&
                    props.handleAutomapperSuggestionSelection) ||
                  undefined,
                getMappedFields: getMappedFieldsBind,
                openSelectElement:
                  typeof props.openSelectElement !== 'undefined' &&
                  props.openSelectElement.line === index
                    ? props.openSelectElement
                    : undefined,
                showHiddenFields: props.showHiddenFields,
                automapperSuggestions:
                  (!props.readonly && props.automapperSuggestions) || [],
                mustMatchPreferences: props.mustMatchPreferences,
                columnOptions,
                mappingOptionsMenuGenerator: () => ({
                  matchBehavior: {
                    label: (
                      <>
                        {wbText('matchBehavior')}
                        <ul style={{ padding: 0, margin: 0 }}>
                          {Object.entries({
                            ignoreWhenBlank: {
                              title: wbText('ignoreWhenBlank'),
                              description: wbText('ignoreWhenBlankDescription'),
                            },
                            ignoreAlways: {
                              title: wbText('ignoreAlways'),
                              description: wbText('ignoreAlwaysDescription'),
                            },
                            ignoreNever: {
                              title: wbText('ignoreNever'),
                              description: wbText('ignoreNeverDescription'),
                            },
                          }).map(([id, { title, description }]) => (
                            <li key={id}>
                              <label title={description}>
                                <input
                                  type="radio"
                                  name="match-behavior"
                                  value={id}
                                  checked={columnOptions.matchBehavior === id}
                                  readOnly={props.readonly}
                                  onChange={({ target }): void =>
                                    props.handleChangeMatchBehaviorAction(
                                      index,
                                      target.value as MatchBehaviors
                                    )
                                  }
                                />
                                {` ${title}`}
                              </label>
                            </li>
                          ))}
                        </ul>
                      </>
                    ),
                  },
                  nullAllowed: {
                    label: (
                      <label>
                        <input
                          type="checkbox"
                          checked={columnOptions.nullAllowed}
                          disabled={props.readonly}
                          onChange={
                            (!props.readonly &&
                              ((event): void =>
                                props.handleToggleAllowNullsAction(
                                  index,
                                  event.target.checked
                                ))) ||
                            undefined
                          }
                        />{' '}
                        {wbText('allowNullValues')}
                      </label>
                    ),
                  },
                  default: {
                    label: (
                      <>
                        <label>
                          <input
                            type="checkbox"
                            checked={columnOptions.default !== null}
                            disabled={props.readonly}
                            onChange={
                              (!props.readonly &&
                                ((): void =>
                                  props.handleChangeDefaultValue(
                                    index,
                                    columnOptions.default === null ? '' : null
                                  ))) ||
                              undefined
                            }
                          />{' '}
                          {wbText('useDefaultValue')}
                          {columnOptions.default !== null && ':'}
                        </label>
                        {typeof columnOptions.default === 'string' && (
                          <>
                            <br />
                            <textarea
                              value={columnOptions.default || ''}
                              onChange={
                                (!props.readonly &&
                                  ((event): void =>
                                    props.handleChangeDefaultValue(
                                      index,
                                      event.target.value
                                    ))) ||
                                undefined
                              }
                              disabled={props.readonly}
                            />
                          </>
                        )}
                      </>
                    ),
                    title: wbText('useDefaultValueDescription'),
                  },
                }),
              })}
            />
          )
        )}
      </section>

      <MappingsControlPanel
        showHiddenFields={props.showHiddenFields}
        handleToggleHiddenFields={props.handleToggleHiddenFields}
        handleAddNewHeader={
          props.readonly
            ? undefined
            : (): void => {
                props.handleAddNewHeader();
                props.handleAutoScrollStatusChange('listOfMappings', true);
              }
        }
        readonly={props.readonly}
      />
    </>
  );
}
