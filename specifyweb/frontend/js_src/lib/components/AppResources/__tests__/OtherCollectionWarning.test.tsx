import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../Tabs';
import { testAppResources } from './testAppResources';

const { OtherCollectionWarning } = exportsForTests;

requireContext();

describe('OtherCollectionWarning', () => {
  test('(no collection, no discipline)', () => {
    const { asFragment } = render(
      <OtherCollectionWarning directory={testAppResources.directories[0]} />
    );
    expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
  });

  test('(same collection)', () => {
    const { asFragment } = render(
      <OtherCollectionWarning directory={testAppResources.directories[2]} />
    );
    expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
  });

  test('(no collection, same discipline)', () => {
    const { asFragment } = render(
      <OtherCollectionWarning
        directory={{ ...testAppResources.directories[2], collection: null }}
      />
    );
    expect(asFragment()).toMatchInlineSnapshot(`<DocumentFragment />`);
  });

  test('(different collection, same discipline)', () => {
    render(
      <OtherCollectionWarning
        directory={{
          ...testAppResources.directories[2],
          collection: '/api/specify/collection/909/',
        }}
      />
    );
    const summary = screen.getByRole('button', {
      name: 'Different collection or discipline Show details',
    });
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByText(
        'Switch to that collection before editing this resource.'
      )
    ).not.toBeInTheDocument();
    fireEvent.click(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    expect(summary).toHaveTextContent('Hide details');
    expect(
      screen.getByText(
        'Switch to that collection before editing this resource.'
      )
    ).toBeVisible();
  });

  test('(no collection, different discipline)', () => {
    render(
      <OtherCollectionWarning
        directory={{
          ...testAppResources.directories[2],
          discipline: '/api/specify/discipline/909/',
          collection: null,
        }}
      />
    );
    expect(
      screen.getByText('Different collection or discipline')
    ).toBeInTheDocument();
  });
});
