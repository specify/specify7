import React from 'react';

import { useHueDifference } from '../../hooks/useHueDifference';
import { commonText } from '../../localization/common';
import { useDarkMode } from '../Preferences/Hooks';

export function SplashScreen({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  const hueDifference = useHueDifference();
  const isDarkMode = useDarkMode();
  return (
    <div
      className={`
        flex w-full items-center justify-center overflow-y-auto
        bg-gray-400 dark:bg-neutral-900
      `}
    >
      <div
        className={`
          flex w-full flex-col gap-4 rounded bg-gray-100 p-16
          outline outline-1 outline-gray-300 dark:outline-neutral-800 dark:bg-neutral-800 sm:max-w-md
        `}
      >
        <header className="pb-2">
          <h1 className="sr-only">{commonText.specifySeven()}</h1>
          <img
            alt=""
            className="max-w-xs hover:animate-hue-rotate"
            src={isDarkMode ? '/static/img/logo.svg' : '/static/img/logo_dark.svg'}
            style={{ filter: `hue-rotate(${hueDifference}deg)` }}
          />
        </header>
        <main className="contents">{children}</main>
      </div>
    </div>
  );
}
