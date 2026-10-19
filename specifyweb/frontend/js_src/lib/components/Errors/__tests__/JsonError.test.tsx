import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { backEndText } from '../../../localization/backEnd';
import { requireContext } from '../../../tests/helpers';
import { formatError } from '../FormatError';

requireContext();

test('renders a rank-query numbering error without falling back to raw output', async () => {
  const message =
    'Invalid Taxon tree numbering in definition 12 at node 345. Repair the tree numbering before querying ranks.';
  const traceback = 'TreeBusinessRuleException: invalid tree numbering';
  const responseText = JSON.stringify({
    exception: 'TreeBusinessRuleException',
    message,
    data: "{'tree': 'Taxon', 'treeDefId': 12, 'nodeId': 345}",
    traceback,
  });
  const [error] = formatError(
    { statusText: 'Internal Server Error', responseText },
    '/stored_query/ephemeral/'
  );
  const { container } = render(error);

  const heading = screen.getByRole('heading', {
    name: 'TreeBusinessRuleException',
  });
  expect(screen.getByText(message)).toBeVisible();
  expect(heading.parentElement?.querySelector('svg')).toBeInTheDocument();
  expect(screen.getByText('Tax', { selector: 'text' })).toBeInTheDocument();
  expect(container.querySelector('iframe')).not.toBeInTheDocument();
  expect(screen.queryByText(responseText)).not.toBeInTheDocument();

  const trace = screen.getByText(traceback, { selector: 'pre' });
  expect(trace.closest('details')).not.toHaveAttribute('open');
  await userEvent.click(screen.getByText(backEndText.showTraceback()));
  expect(trace.closest('details')).toHaveAttribute('open');
});
