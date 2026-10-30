import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { scrollIntoView } from '../../TreeView/helpers';
import { PreferencesContent } from '../index';
import { useTopChild } from '../useTopChild';

jest.mock('../../TreeView/helpers', () => ({
  ...jest.requireActual('../../TreeView/helpers'),
  scrollIntoView: jest.fn(),
}));
requireContext();

const definitions = [
  [
    'general',
    {
      title: commonText.save(),
      subCategories: [],
    },
  ],
] as const;

function PreferencesHarness(): JSX.Element {
  const { forwardRefs, setVisibleChild } = useTopChild();
  React.useEffect(() => setVisibleChild(0), [setVisibleChild]);
  return (
    <PreferencesContent definitions={definitions} forwardRefs={forwardRefs} />
  );
}

test('a preference-page rerender does not scroll back to the active section', () => {
  const { rerender } = mount(<PreferencesHarness />);
  jest.mocked(scrollIntoView).mockClear();
  rerender(<PreferencesHarness />);
  expect(scrollIntoView).not.toHaveBeenCalled();
});
