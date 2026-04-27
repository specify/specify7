import React from 'react';

import { headerText } from '../../localization/header';
import type { DwcTerm } from './types';

export function TermTooltip({
  iri,
  term,
  onClose: handleClose,
}: {
  readonly iri: string;
  readonly term: DwcTerm;
  readonly onClose: () => void;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (
        containerRef.current !== null &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClose]);

  const termName = iri.split('/').pop() ?? iri;

  return (
    <div
      className="absolute z-20 mt-1 w-80 rounded border border-gray-300
        bg-white p-3 shadow-lg dark:border-neutral-600 dark:bg-neutral-800"
      ref={containerRef}
    >
      <div className="mb-2 font-bold">{term.label}</div>
      <div className="mb-2 font-mono text-xs text-gray-500 dark:text-neutral-400">
        {iri}
      </div>
      <p className="mb-2 text-sm">{term.definition}</p>
      <a
        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        href={`https://dwc.tdwg.org/terms/#${termName}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        {headerText.viewOnTdwg()}
      </a>
    </div>
  );
}
