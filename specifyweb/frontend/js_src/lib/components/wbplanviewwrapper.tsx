/**
 * Entrypoint for the workbench mapper
 *
 * @module
 */

import React from 'react';

import wbText from '../localization/workbench';
import * as navigation from '../navigation';
import dataModelStorage from '../wbplanviewmodel';
import { dataModelPromise } from '../wbplanviewmodelfetcher';
import { useId, useTitle } from './hooks';
import { LoadingScreen } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import type { WbPlanViewConstructorProps } from './wbplanview';
import { WbPlanView } from './wbplanview';
import { crash } from './errorboundary';

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

  const [schemaLoaded, setSchemaLoaded] = React.useState<boolean>(
    typeof dataModelStorage.tables !== 'undefined'
  );

  React.useEffect(() => {
    if (schemaLoaded) return;

    dataModelPromise.then(() => setSchemaLoaded(true)).catch(crash);
  }, [schemaLoaded]);

  // Reorder headers if needed
  const headers =
    dataset.visualorder === null
      ? dataset.columns
      : dataset.visualorder.map((physicalCol) => dataset.columns[physicalCol]);
  return schemaLoaded ? (
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
