import React from 'react';

import { commonText } from '../../localization/common';

export function SplashScreen({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div
      className={`
        flex h-full items-center justify-center overflow-y-auto
        bg-gray-400 dark:bg-neutral-900
      `}
    >
      <div
        className={`
          flex w-full flex-col gap-4 rounded bg-gray-100 p-16
          shadow-2xl dark:bg-neutral-800 sm:max-w-md
        `}
      >
        <header className="pb-2">
          <h1 className="sr-only">{commonText('specifySeven')}</h1>
          <img
            alt=""
            className="max-w-xs hover:animate-hue-rotate"
            src="/static/img/seven_logo.png"
          />
        </header>
        <main className="contents">{children}</main>
      </div>
    </div>
  );
}
