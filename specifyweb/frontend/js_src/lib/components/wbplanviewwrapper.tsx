/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { useAsyncState, useTitle, useUnloadProtect } from './hooks';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { WbPlanViewConstructorProps } from './wbplanview';
import { WbPlanView } from './wbplanview';

/**
 * Entrypoint react component for the workbench mapper
 *
 * @remarks
 * Makes sure schema is loaded
 * Reorders headers if needed
 */
function WbPlanViewWrapper({
  dataset,
}: WbPlanViewConstructorProps): JSX.Element {
  useTitle(dataset.name);

  const [schemaLoaded = false] = useAsyncState<boolean>(
    React.useCallback(async () => dataModelPromise.then(() => true), [])
  );

  // Reorder headers if needed
  const headers =
    dataset.visualorder === null
      ? dataset.columns
      : dataset.visualorder.map((physicalCol) => dataset.columns[physicalCol]);

  const setHasUnloadProtect = useUnloadProtect(
    false,
    wbText('unloadProtectMessage')
  );

  return schemaLoaded ? (
    <WbPlanView
      dataset={dataset}
      uploadPlan={dataset.uploadplan}
      headers={headers}
      readonly={dataset.uploadresult?.success ?? false}
      removeUnloadProtect={(): void => setHasUnloadProtect(false)}
      setUnloadProtect={(): void => setHasUnloadProtect(true)}
    />
  ) : (
    <LoadingScreen />
  );
}

export default createBackboneView(WbPlanViewWrapper);
