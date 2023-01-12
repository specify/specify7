import React from 'react';

import type { GetSet } from '../../utils/types';
import type { Formatter } from './spec';

export function FormatterElement({
  item: [formatter, setFormatter],
  isReadOnly,
}: {
  readonly item: GetSet<Formatter>;
  readonly isReadOnly: boolean;
}): JSX.Element {
  // FIXME: include a preview of a the results
  return <pre>{JSON.stringify(formatter, null, 2)}</pre>;
}
