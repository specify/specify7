import React from 'react';

import type { RA } from '../../utils/types';

export function BrokerSection({
  anchor,
  label,
  children,
}: {
  readonly anchor: string;
  readonly label: string;
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <section id={anchor}>
      <h3>{label}</h3>
      {children}
    </section>
  );
}

export function BrokerTable({
  className,
  header,
  children,
}: {
  readonly className?: string;
  readonly header?: JSX.Element | RA<JSX.Element>;
  readonly children: RA<JSX.Element>;
}): JSX.Element {
  return (
    <table className={className}>
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
  className = '',
}: {
  readonly header: string;
  readonly title?: string;
  readonly cells: RA<JSX.Element | string>;
  readonly className?: string;
}): JSX.Element {
  return (
    <tr className={className}>
      <th scope="row" title={title}>
        {header}
      </th>
      {cells.map((column, index) => (
        <td key={index}>{column}</td>
      ))}
    </tr>
  );
}
