import React from 'react';

import { commonText } from '../../localization/common';
import { ErrorMessage, WarningMessage } from '../Atoms';
import { icons } from '../Atoms/Icons';

export function CollapsibleAlert({
  variant,
  summary,
  expanded,
  onToggle,
  children,
}: {
  readonly variant: 'error' | 'warning';
  readonly summary: React.ReactNode;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly children: React.ReactNode;
}): JSX.Element {
  const Message = variant === 'error' ? ErrorMessage : WarningMessage;
  return (
    <Message className="!gap-0 !p-0 text-sm leading-5">
      <button
        aria-expanded={expanded}
        className="flex min-h-[1.75rem] w-full items-center gap-1 px-2 py-1 text-left hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] [&>svg]:h-4 [&>svg]:w-4"
        type="button"
        onClick={onToggle}
      >
        {expanded ? icons.chevronDown : icons.chevronRight}
        <span className="min-w-0 flex-1">{summary}</span>
        <span className="shrink-0 text-xs">
          {expanded ? commonText.hideDetails() : commonText.showDetails()}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-white/30 px-2 py-1">{children}</div>
      )}
    </Message>
  );
}
