import React from 'react';

import type { RA } from '../../utils/types';
import { className } from '../Atoms/className';

export function BrokerSection({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <section>
      <h3 className={`text-lg ${className.headerPrimary}`}>{label}</h3>
      {children}
    </section>
  );
}

export function BrokerTable({
  className,
  header,
  columns,
  children,
}: {
  readonly className?: string;
  readonly header?: JSX.Element | RA<JSX.Element>;
  readonly columns: number;
  readonly children: RA<JSX.Element>;
}): JSX.Element {
  return (
    <table
      className={`
        grid-table w-full grid-cols-[auto_repeat(var(--columns),auto)]
        lg:grid-cols-[auto_repeat(var(--columns),1fr)]
        [&_:is(td,th)]:p-2 [&_tbody_:is(td,th)]:border
        [&_tbody_:is(td,th)]:border-gray-300
        dark:[&_tbody_:is(td,th)]:border-neutral-700 [&_tbody_td]:break-words
        [&_thead_:is(td,th)]:bg-gray-300
        [&_thead_:is(td,th)]:dark:bg-neutral-700
        ${className ?? ''}
      `}
      style={
        {
          '--columns': columns,
        } as React.CSSProperties
      }
    >
      {header && (
        <thead>
          <tr>{header}</tr>
        </thead>
      )}
      <tbody>{children}</tbody>
    </table>
  );
}

export function BrokerRow({
  header,
  title,
  cells,
  cellClassName = '',
}: {
  readonly header: string;
  readonly title?: string;
  readonly cells: RA<JSX.Element | string>;
  readonly cellClassName?: string;
}): JSX.Element {
  return (
    <tr>
      <th className="text-left" scope="row" title={title}>
        {header}
      </th>
      {cells.map((column, index) => (
        <td className={cellClassName} key={index}>
          {column}
        </td>
      ))}
    </tr>
  );
}
