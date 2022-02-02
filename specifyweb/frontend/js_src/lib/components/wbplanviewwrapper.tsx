/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { useAsyncState, useId, useTitle } from './hooks';
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
  const id = useId('wbplanview-wrapper');
  useTitle(dataset.name);

  const [schemaLoaded] = useAsyncState<boolean>(
    React.useCallback(async () => dataModelPromise.then(() => true), [])
  );

  // Reorder headers if needed
  const headers =
    dataset.visualorder === null
      ? dataset.columns
      : dataset.visualorder.map((physicalCol) => dataset.columns[physicalCol]);
  return Boolean(schemaLoaded) ? (
    <WbPlanView
      dataset={dataset}
      uploadPlan={dataset.uploadplan}
      headers={headers}
      readonly={dataset.uploadresult?.success ?? false}
      removeUnloadProtect={(): void => navigation.removeUnloadProtect(id(''))}
      setUnloadProtect={(): void =>
        navigation.addUnloadProtect(id(''), wbText('unloadProtectMessage'))
      }
    />
  ) : (
    <LoadingScreen />
  );
}

export default createBackboneView(WbPlanViewWrapper);
