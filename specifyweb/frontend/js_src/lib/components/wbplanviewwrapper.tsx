/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import navigation from '../navigation';
import dataModelStorage from '../wbplanviewmodel';
import fetchDataModel from '../wbplanviewmodelfetcher';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type {
  PublicWbPlanViewProps,
  WbPlanViewWrapperProps,
} from './wbplanview';
import { WbPlanView } from './wbplanview';

const schemaFetchedPromise = fetchDataModel();

/**
 * Entrypoint react component for the workbench mapper
 *
 * @remarks
 * Makes sure schema is loaded
 * Reorders headers if needed
 */
function WbPlanViewWrapper(props: WbPlanViewWrapperProps): JSX.Element {
  const [schemaLoaded, setSchemaLoaded] = React.useState<boolean>(
    typeof dataModelStorage.tables !== 'undefined'
  );

  React.useEffect(() => {
    if (schemaLoaded) return;

    schemaFetchedPromise
      .then(() => setSchemaLoaded(true))
      .catch((error) => {
        throw error;
      });
  }, [schemaLoaded]);

  // Reorder headers if needed
  const headers =
    props.dataset.visualorder === null
      ? props.dataset.columns
      : props.dataset.visualorder.map(
          (physicalCol) => props.dataset.columns[physicalCol]
        );
  return schemaLoaded ? (
    <WbPlanView
      {...props}
      uploadPlan={props.dataset.uploadplan}
      headers={headers}
      readonly={props.dataset.uploadresult?.success ?? false}
    />
  ) : (
    <LoadingScreen />
  );
}

type WbPlanViewBackboneProps = WbPlanViewWrapperProps &
  PublicWbPlanViewProps & {
    header: HTMLElement;
  };

const setUnloadProtect = (self: WbPlanViewBackboneProps): void =>
  navigation.addUnloadProtect(self, wbText('unloadProtectMessage'));

const removeUnloadProtect = (self: WbPlanViewBackboneProps): void =>
  navigation.removeUnloadProtect(self);

/**
 * Backbone View wrapper for the entrypoint react component
 */
export default createBackboneView<
  PublicWbPlanViewProps,
  WbPlanViewBackboneProps,
  WbPlanViewWrapperProps
>({
  moduleName: 'WbPlanView',
  title: (self) => self.dataset.name,
  className: 'wb-plan-view content-no-shadow',
  initialize(self, { dataset }) {
    self.dataset = dataset;
  },
  renderPre(self) {
    self.el.classList.add('wbplanview');
  },
  remove(self) {
    removeUnloadProtect(self);
  },
  Component: WbPlanViewWrapper,
  getComponentProps: (self) => ({
    dataset: self.dataset,
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
  }),
});
