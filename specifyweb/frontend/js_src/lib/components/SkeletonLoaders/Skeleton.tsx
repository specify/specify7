import React from 'react';

export const Skeleton = {
  Line({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-4 w-14 rounded`} />;
  },
  LongLine({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-4 rounded`} />;
  },
  Square({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-32 rounded `} />;
  },
  SmallSquare({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-6 w-6 rounded`} />;
  },
  Rectangle({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-6 w-64 rounded`} />;
  },
  SmallRectangle({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-6 w-16 rounded`} />;
  },
  TallRectangle({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton w-32 rounded`} />;
  },
  ThinRectangle({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton h-32 w-6 rounded`} />;
  },
  SmallCircle({ className }: { readonly className?: string }): JSX.Element {
    return <div className={`${className} skeleton w-6 rounded-full`} />;
  },
};
