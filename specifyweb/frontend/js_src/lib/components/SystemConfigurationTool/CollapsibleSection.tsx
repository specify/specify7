import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';

export const CollapsibleSection = ({
  title,
  children,
  defaultOpen = true,
  hasChildren,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  hasChildren: boolean;
}) => {
  const [isOpen, _, __, handleOpen] = useBooleanState(defaultOpen);

  return (
    <div className="my-2">
      <div className="flex items-center">
        <Button.Icon
          icon={isOpen ? 'chevronDown' : 'chevronUp'}
          title={'collapse'}
          className={`ml-2 ${hasChildren ? '' : 'invisible'}`}
          onClick={handleOpen}
        />
        {title}
      </div>

      {isOpen && <div className="ml-6 mt-2">{children}</div>}
    </div>
  );
};
