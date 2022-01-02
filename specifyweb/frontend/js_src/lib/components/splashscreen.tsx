import React from 'react';

import commonText from '../localization/common';

export function SplashScreen({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="flex items-center justify-center h-full overflow-y-auto bg-gray-400">
      <div className="sm:max-w-md flex flex-col w-full gap-4 p-16 bg-gray-100 rounded shadow-2xl">
        <header>
          <h1 className="sr-only">{commonText('specifySeven')}</h1>
          <img src="/static/img/seven_logo.png" alt="" className="max-w-xs" />
        </header>
        <main className="contents">{children}</main>
      </div>
    </div>
  );
}

export const parseDjangoDump = <T,>(id: string): T =>
  JSON.parse(document.getElementById(id)?.textContent ?? '[]') as T;
