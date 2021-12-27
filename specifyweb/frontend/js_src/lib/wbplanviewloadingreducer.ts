/**
 * Action reducer for async actions
 *
 * Probably an over kill (React.useEffect may have been better suited for this)
 *
 * @module
 */

import type { State } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import type {
  Dataset,
  SpecifyResource,
  WbPlanViewWrapperProps,
} from './components/wbplanview';
import type { MappingState } from './components/wbplanviewstate';
import { mappingsTreeToUploadPlan } from './mappingstreetouploadplan';
import { renameNewlyCreatedHeaders } from './wbplanviewheaderhelper';
import { getMappingsTree, getMustMatchTables, goBack } from './wbplanviewutils';
import ajax from './ajax';

type NavigateBackState = State<
  'NavigateBackState',
  {
    wb: SpecifyResource;
  }
>;

type SavePlanState = State<
  'SavePlanState',
  { props: WbPlanViewWrapperProps; state: MappingState }
>;

export type LoadingStates = NavigateBackState | SavePlanState;

export const loadingStateDispatch = generateDispatch<LoadingStates>({
  NavigateBackState: (state): void =>
    /*
     * Need to make the `Loading` dialog
     * appear before the `Leave Page?` dialog
     */
    void setTimeout(() => goBack(state.wb.id), 10),
  SavePlanState({ state, props }): void {
    const renamedMappedLines = renameNewlyCreatedHeaders(
      state.baseTableName,
      props.dataset.columns,
      state.lines
    );

    const newlyAddedHeaders = renamedMappedLines
      .filter(
        ({ headerName, mappingPath }) =>
          mappingPath.length > 0 &&
          mappingPath[0] !== '0' &&
          !props.dataset.columns.includes(headerName)
      )
      .map(({ headerName }) => headerName);

    const uploadPlan = mappingsTreeToUploadPlan(
      state.baseTableName,
      getMappingsTree(renamedMappedLines, true),
      getMustMatchTables(state)
    );

    const dataSetRequestUrl = `/api/workbench/dataset/${props.dataset.id}/`;

    void ajax(dataSetRequestUrl, {
      method: 'PUT',
      body: {
        uploadplan: uploadPlan,
      },
    }).then(() => {
      if (state.changesMade) props.removeUnloadProtect();

      return newlyAddedHeaders.length > 0
        ? ajax<Dataset>(dataSetRequestUrl).then(
            async ({ data: { columns, visualorder } }) =>
              ajax(dataSetRequestUrl, {
                method: 'PUT',
                body: {
                  visualorder: [
                    ...(visualorder ??
                      Object.keys(props.dataset.columns).map((index) =>
                        Number.parseInt(index)
                      )),
                    ...newlyAddedHeaders.map((headerName) =>
                      columns.indexOf(headerName)
                    ),
                  ],
                },
              }).then(() => goBack(props.dataset.id))
          )
        : goBack(props.dataset.id);
    });
  },
});
