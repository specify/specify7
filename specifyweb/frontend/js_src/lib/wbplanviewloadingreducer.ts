import type { SpecifyResource } from './components/wbplanview';
import navigation from './navigation';
import schema from './schema';
import type { State } from './statemanagement';
import { generateDispatch } from './statemanagement';
import type { UploadPlan } from './uploadplantomappingstree';
import { uploadPlanStringToObject } from './uploadplantomappingstree';
import type { WBPlanViewActions } from './wbplanviewreducer';

interface LoadingStateBase<T extends string> extends State<T> {
  dispatchAction?: (action: WBPlanViewActions) => void;
}

type LoadTemplateSelectionState = LoadingStateBase<'LoadTemplateSelectionState'>;

interface NavigateBackState extends State<'NavigateBackState'> {
  readonly wb: SpecifyResource;
}

export type LoadingStates = LoadTemplateSelectionState | NavigateBackState;

export const loadingStateDispatch = generateDispatch<LoadingStates>({
  LoadTemplateSelectionState: (state) => {
    if (typeof state.dispatchAction !== 'function')
      throw new Error('Dispatch function was not provided');

    const wbs = new (schema as any).models.Workbench.LazyCollection({
      filters: { orderby: 'name', ownerpermissionlevel: 1 },
    });
    wbs.fetch({ limit: 5000 }).done(async () =>
      Promise.all(wbs.models.map((wb: any) => wb.rget('workbenchtemplate')))
        .then((workbenchTemplates: any) =>
          state.dispatchAction!({
            type: 'TemplatesLoadedAction',
            templates: workbenchTemplates
              .map((wbt: any) => [
                uploadPlanStringToObject(wbt.get('remarks') as string),
                wbt.get('name') as string,
              ])
              .filter(
                ([uploadPlan]: [UploadPlan | null]) => uploadPlan != undefined
              )
              .map(([uploadPlan, datasetName]: [UploadPlan, string]) => ({
                datasetName,
                uploadPlan,
              })),
          })
        )
        .catch((error) => {
          throw error;
        })
    );
  },
  NavigateBackState: (state): void =>
    /*
     * Need to make the `Loading` dialog
     * appear before the `Leave Page?` dialog
     */
    void setTimeout(() => navigation.go(`/workbench/${state.wb.id}/`), 10),
});
