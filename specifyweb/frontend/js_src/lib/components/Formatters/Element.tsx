import { GetSet } from '../../utils/types';
import React from 'react';
import { Aggregator } from './dataObjFormatters';

export function FormatterWrapper(): JSX.Element {}

function FormatterElement({
  item: [formatter, setFormatter],
  isReadOnly,
}: {
  readonly item: GetSet<Formatter>;
  readonly isReadOnly: boolean;
}): JSX.Element {
  return <pre>{JSON.stringify(formatter, null, 2)}</pre>;
}

function AggregatorElement({
  item: [aggregator, setAggregator],
  isReadOnly,
}: {
  readonly item: GetSet<Aggregator>;
  readonly isReadOnly: boolean;
}): JSX.Element {
  return <pre>{JSON.stringify(aggregator, null, 2)}</pre>;
}
