import { waitFor, within } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import { mount } from '../../../tests/reactUtils';
import { Http } from '../../../utils/ajax/definitions';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { datasetVariants } from '../../WbUtils/datasetVariants';
import { WbRollback } from '../WbRollback';

const datasetId = 7;
const viewerLocalization = datasetVariants.workbench.localization.viewer;

overrideAjax(`/api/workbench/unupload/${datasetId}/`, '', {
  method: 'POST',
  responseCode: Http.CONFLICT,
});

test('reopens rollback status after conflict response', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation();
  const handleStatus = jest.fn();
  const loadingHandler = jest.fn((promise: Promise<unknown>) => {
    void promise;
  });

  try {
    const { getByRole, queryByRole, user } = mount(
      <UnloadProtectsContext.Provider value={[]}>
        <LoadingContext.Provider value={loadingHandler}>
          <WbRollback
            datasetId={datasetId}
            triggerStatusComponent={handleStatus}
            viewerLocalization={viewerLocalization}
          />
        </LoadingContext.Provider>
      </UnloadProtectsContext.Provider>
    );

    await user.click(getByRole('button', { name: viewerLocalization.undo }));

    const dialog = getByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: viewerLocalization.undo })
    );

    await waitFor(() => {
      expect(handleStatus).toHaveBeenCalledWith('unupload');
    });
    expect(loadingHandler).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(queryByRole('dialog')).toBeNull();
    });
  } finally {
    consoleError.mockRestore();
  }
});
