/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import { useTitle, useUnloadProtect } from './hooks';
import createBackboneView from './reactbackboneextend';
import type { WbPlanViewConstructorProps } from './wbplanview';
import { WbPlanView } from './wbplanview';
import { hasPermission } from '../permissions';

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

  // Reorder headers if needed
  const headers =
    dataset.visualorder === null
      ? dataset.columns
      : dataset.visualorder.map((physicalCol) => dataset.columns[physicalCol]);

  const setHasUnloadProtect = useUnloadProtect(
    false,
    wbText('unloadProtectMessage')
  );

  return (
    <WbPlanView
      dataset={dataset}
      uploadPlan={dataset.uploadplan}
      headers={headers}
      readonly={
        (!hasPermission('/workbench/dataset', 'update') ||
          dataset.uploadresult?.success) ??
        false
      }
      removeUnloadProtect={(): void => setHasUnloadProtect(false)}
      setUnloadProtect={(): void => setHasUnloadProtect(true)}
    />
  );
}

export default createBackboneView(WbPlanViewWrapper);
