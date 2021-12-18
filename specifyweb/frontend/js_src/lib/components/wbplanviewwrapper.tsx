/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import navigation from '../navigation';
import dataModelStorage from '../wbplanviewmodel';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type {
  IR,
  PublicWbPlanViewProps,
  WbPlanViewWrapperProps,
} from './wbplanview';
import { WbPlanView } from './wbplanview';

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

    dataModelPromise
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

const setUnloadProtect = (self: IR<unknown>): void =>
  navigation.addUnloadProtect(self, wbText('unloadProtectMessage'));

const removeUnloadProtect = (self: IR<unknown>): void =>
  navigation.removeUnloadProtect(self);

/**
 * Backbone View wrapper for the entrypoint react component
 */
export default createBackboneView<
  PublicWbPlanViewProps,
  WbPlanViewWrapperProps
>({
  moduleName: 'WbPlanView',
  title: (self) => self.options.dataset.name,
  className: 'wbplanview content-no-shadow',
  remove(self) {
    removeUnloadProtect(self);
  },
  component: WbPlanViewWrapper,
  getComponentProps: (self) => ({
    dataset: self.options.dataset,
    removeUnloadProtect: (): void => removeUnloadProtect(self),
    setUnloadProtect: (): void => setUnloadProtect(self),
  }),
});
