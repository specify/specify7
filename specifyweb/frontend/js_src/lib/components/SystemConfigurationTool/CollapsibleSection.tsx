import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  hasChildren,
}: {
  readonly title: React.ReactNode;
  readonly children: React.ReactNode;
  readonly defaultOpen?: boolean;
  readonly hasChildren: boolean;
}) {
  const [isOpen, _, __, handleOpen] = useBooleanState(defaultOpen);

  return (
    <div className="my-2">
      <div className="flex items-center">
        <Button.Icon
          className={`ml-2 ${hasChildren ? '' : 'invisible'}`}
          icon={isOpen ? 'chevronDown' : 'chevronRight'}
          title="collapse"
          onClick={handleOpen}
        />
        {title}
      </div>

      {isOpen && <div className="ml-6 mt-2">{children}</div>}
    </div>
  );
}
