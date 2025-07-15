/**
 * Format different parts of the response object
 */

import React from 'react';

import { formatBoolean } from '../../utils/parser/definitions';
import type { IR, RA } from '../../utils/types';
import { Input } from '../Atoms/Form';

function List({
  children: values,
}: {
  readonly children: RA<unknown>;
}): JSX.Element | null {
  if (values.length === 0) return null;
  else if (values.length === 1) return <BrokerValue>{values[0]}</BrokerValue>;
  else
    return (
      <Dict>
        {Object.fromEntries(
          values.map((value, index) => [`[${index + 1}]`, value])
        )}
      </Dict>
    );
}

function String({
  children: value,
}: {
  readonly children: unknown;
}): JSX.Element {
  /*
   * REFACTOR: why not just use a read only textbox? I belive it was due to some
   *   styling limitations - need to investiage
   */

  return (
    <div
      aria-multiline="true"
      aria-readonly="true"
      className="w-full min-w-[theme(spacing.24)] rounded border border-gray-500 p-2"
      role="textbox"
    >
      {`${value?.toString() ?? ''}`}
    </div>
  );
}

export function BrokerValue({
  children: value,
}: {
  readonly children: unknown;
}): JSX.Element | null {
  if (typeof value === 'boolean')
    return (
      <div
        className={`flex gap-1 ${value ? 'text-green-500' : 'text-red-500'}`}
      >
        <Input.Checkbox checked={value} isReadOnly />
        {formatBoolean(value)}
      </div>
    );
  else if (Array.isArray(value)) return <List>{value}</List>;
  else if (value === null || value === undefined) return null;
  else if (typeof value === 'object')
    return <Dict>{value as IR<unknown>}</Dict>;
  else return <String>{value}</String>;
}

function Line({
  label,
  children: value,
}: {
  readonly label: string;
  readonly children: JSX.Element;
}): JSX.Element {
  return (
    <>
      <div>{label}</div>
      <div className="flex items-center [&>*]:flex-1">{value}</div>
    </>
  );
}

function Dict({
  children: fields,
}: {
  readonly children: IR<unknown>;
}): JSX.Element {
  return (
    <div
      className={`
        grid auto-rows-auto grid-cols-[auto_1fr] gap-2
      `}
    >
      {Object.entries(fields).map(([label, value]) => (
        <Line key={label} label={label}>
          <BrokerValue>{value}</BrokerValue>
        </Line>
      ))}
    </div>
  );
}
