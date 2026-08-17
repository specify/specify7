import React from 'react';
import * as Router from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { commonText } from '../../../localization/common';
import { attachmentsText } from '../../../localization/attachments';
import { SetMenuContext } from '../../Header/MenuContext';
import {
  attachmentSettingsPromise,
  overrideAttachmentServerStatus,
} from '../attachments';
import { AttachmentsView } from '..';

/*
 * Bypass the paginated attachment fetches (a pre-existing, unrelated bug in
 * useAsyncState's real implementation crashes when exercised here); only the
 * status-driven rendering is under test
 */
jest.mock('../../../hooks/useAsyncState', () => {
  const ReactModule = require('react');
  return {
    __esModule: true,
    useAsyncState: () => ReactModule.useState(undefined),
    usePromise: (promise: Promise<unknown>) => {
      const [state, setState] = ReactModule.useState(undefined);
      ReactModule.useEffect(() => {
        let ignore = false;
        promise.then((value: unknown) => {
          if (!ignore) setState(value);
        });
        return () => {
          ignore = true;
        };
      }, [promise]);
      return [state, setState];
    },
  };
});

requireContext();

function TestAttachmentsView(): JSX.Element {
  return (
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <AttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );
}

describe('AttachmentsView', () => {
  beforeEach(async () => {
    await attachmentSettingsPromise;
  });

  test('replaces the gallery with a single unavailable message and disables Import', async () => {
    overrideAttachmentServerStatus('unavailable');

    const { findByRole } = mount(<TestAttachmentsView />);

    await findByRole('heading', {
      name: attachmentsText.attachmentServerUnavailable(),
    });

    const importButton = await findByRole('button', {
      name: commonText.import(),
    });
    expect(importButton).toBeDisabled();
    expect(importButton).toHaveAttribute(
      'title',
      attachmentsText.attachmentServerUnavailable()
    );
  });

  test('shows the gallery and an enabled Import button when available', async () => {
    overrideAttachmentServerStatus('available');

    const { findByRole, queryByRole } = mount(<TestAttachmentsView />);

    const importButton = await findByRole('button', {
      name: commonText.import(),
    });
    expect(importButton).toBeEnabled();
    expect(
      queryByRole('heading', {
        name: attachmentsText.attachmentServerUnavailable(),
      })
    ).not.toBeInTheDocument();
  });
});
