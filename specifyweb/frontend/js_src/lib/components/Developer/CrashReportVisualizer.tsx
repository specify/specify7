import React from 'react';

import { developmentText } from '../../localization/development';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { camelToHuman } from '../../utils/utils';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { downloadFile, FilePicker, fileToText } from '../Molecules/FilePicker';
import { CrashReportFallback, crashReportMapper } from './CrashReportMapper';

export function CrashReportVisualizer(): JSX.Element {
  const [fileName, setFileName] = React.useState<string>('');
  const [file, setFile] = React.useState<string | undefined>(undefined);

  const loading = React.useContext(LoadingContext);
  return (
    <Container.Full>
      <div className="flex items-center gap-2">
        <H2>{developmentText.crashReportVisualizer()}</H2>
        <span className="-ml-2 flex-1" />
        {typeof file === 'string' && (
          <Button.Blue
            onClick={(): void =>
              loading(
                downloadFile(
                  `${fileName || 'Crash Report'}.html`,
                  document.documentElement.outerHTML
                )
              )
            }
          >
            {developmentText.downloadAsHtml()}
          </Button.Blue>
        )}
      </div>
      {file === undefined ? (
        <FilePicker
          acceptedFormats={['txt', 'json']}
          onSelected={(file): void => {
            setFileName(file.name);
            loading(fileToText(file, 'utf8').then(setFile));
          }}
        />
      ) : (
        <JsonParser string={file} />
      )}
    </Container.Full>
  );
}

function JsonParser({ string }: { readonly string: string }): JSX.Element {
  const parsed = React.useMemo(() => {
    try {
      return JSON.parse(string) as unknown;
    } catch (error) {
      return (error as Error).toString();
    }
  }, [string]);

  return typeof parsed === 'object' && parsed !== null ? (
    <>
      {/* This allows to get back the JSON version of the crash report */}
      <noscript>{string}</noscript>
      <CrashReportLines parsed={parsed as IR<unknown>} />
    </>
  ) : (
    <CrashReportFallback value={parsed} />
  );
}

export function CrashReportLines({
  parsed,
  expanded = false,
}: {
  readonly parsed: IR<unknown>;
  readonly expanded?: boolean;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {Object.entries(parsed).map(([key, value]) => (
        <Line expanded={expanded} key={key} name={key} value={value} />
      ))}
    </div>
  );
}

const nameMapper = {
  href: 'URL',
  userAgent: 'Browser and Operating System',
  navigator: 'Environment',
};

const mainSections = new Set([
  'message',
  'href',
  'errorContext',
  'systemInformation',
  'pageHtml',
  'consoleLog',
  'navigator',
]);

const reSimpleName = /\w+/u;

function Line({
  name,
  value,
  expanded,
}: {
  readonly name: string;
  readonly value: unknown;
  readonly expanded: boolean;
}): JSX.Element {
  const Element = crashReportMapper[name] ?? CrashReportFallback;
  return (
    <details open={expanded || f.has(mainSections, name)}>
      <summary>
        {nameMapper[name as 'href'] ??
          (reSimpleName.test(name) ? camelToHuman(name) : name)}
      </summary>
      <div className="flex flex-col gap-2">
        <Element value={value} />
      </div>
    </details>
  );
}
