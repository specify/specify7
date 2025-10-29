import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { sanitizeLoginMessageHtml } from '../../utils/sanitizeLoginMessageHtml';
import { Container, ErrorMessage, WarningMessage } from '../Atoms';
import { Form, Input, Label, Textarea } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';

const MAX_BYTES = 10_240;

type LoginMessageResponse = {
  readonly enabled: boolean;
  readonly html: string;
  readonly source: 'db' | 'config';
};

export function InstitutionalPreferences(): JSX.Element | null {
  const [loadError, setLoadError] = React.useState<string | undefined>();
  const [saveError, setSaveError] = React.useState<string | undefined>();
  const [saveSucceeded, setSaveSucceeded] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const [serverData, setServerData] = useAsyncState<
    LoginMessageResponse | undefined
  >(
    React.useCallback(async () => {
      const response = await ajax<LoginMessageResponse>(
        '/api/admin/institution/login-message',
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
          errorMode: 'silent',
        }
      );
      if (response === undefined || response.data === undefined) {
        setLoadError(preferencesText.loginMessageLoadFailed());
        return undefined;
      }
      setLoadError(undefined);
      return response.data;
    }, [setLoadError]),
    true
  );

  const [draft, setDraft] = React.useState<{
    readonly enabled: boolean;
    readonly html: string;
  }>();

  React.useEffect(() => {
    if (serverData === undefined) return;
    setDraft({ enabled: serverData.enabled, html: serverData.html });
    setSaveSucceeded(false);
  }, [serverData]);

  const isLocked = serverData?.source === 'config';

  const byteLength = React.useMemo(
    () =>
      typeof draft?.html === 'string'
        ? new TextEncoder().encode(draft.html).length
        : 0,
    [draft?.html]
  );
  const isOverLimit = byteLength > MAX_BYTES;
  const sanitizedPreview = React.useMemo(
    () => sanitizeLoginMessageHtml(draft?.html ?? ''),
    [draft?.html]
  );
  const isDirty =
    !isLocked &&
    serverData !== undefined &&
    draft !== undefined &&
    (draft.enabled !== serverData.enabled || draft.html !== serverData.html);

  const handleEnabledChange = React.useCallback((enabled: boolean) => {
    setDraft((previous) =>
      previous === undefined ? undefined : { ...previous, enabled }
    );
    setSaveError(undefined);
    setSaveSucceeded(false);
  }, []);

  const handleHtmlChange = React.useCallback(
    (html: string) => {
      setDraft((previous) => {
        const base =
          previous ?? {
            enabled: serverData?.enabled ?? false,
            html: '',
          };
        return { ...base, html };
      });
      setSaveError(undefined);
      setSaveSucceeded(false);
    },
    [serverData]
  );

  const handleSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (draft === undefined || isLocked) return;
      if (isOverLimit) {
        setSaveError(preferencesText.loginMessageTooLarge());
        setSaveSucceeded(false);
        return;
      }
      setIsSaving(true);
      setSaveError(undefined);
      setSaveSucceeded(false);
      const response = await ajax<LoginMessageResponse>(
        '/api/admin/institution/login-message',
        {
          method: 'PUT',
          headers: { Accept: 'application/json' },
          body: { enabled: draft.enabled, html: draft.html },
          expectedErrors: [Http.BAD_REQUEST, Http.CONFLICT],
          errorMode: 'silent',
        }
      );
      setIsSaving(false);
      if (response === undefined) return;
      if (response.status === Http.CONFLICT) {
        setSaveError(preferencesText.loginMessageConfiguredInSettings());
        return;
      }
      if (response.status === Http.BAD_REQUEST) {
        setSaveError(preferencesText.loginMessageTooLarge());
        return;
      }
      if (response.status === Http.OK) {
        setServerData(() => response.data);
        setDraft({
          enabled: response.data.enabled,
          html: response.data.html,
        });
        setSaveSucceeded(true);
      }
    },
    [draft, isLocked, isOverLimit, setServerData]
  );

  if (loadError !== undefined && draft === undefined && serverData === undefined)
    return (
      <Container.FullGray>
        <Container.Center className="gap-4">
          <h2 className="text-2xl">
            {preferencesText.institutionalPreferences()}
          </h2>
          <ErrorMessage>{loadError}</ErrorMessage>
        </Container.Center>
      </Container.FullGray>
    );

  if (draft === undefined) return null;

  return (
    <Container.FullGray>
      <Container.Center className="gap-6">
        <h2 className="text-2xl">
          {preferencesText.institutionalPreferences()}
        </h2>
        <p>{preferencesText.loginMessageDescription()}</p>
        {isLocked && (
          <WarningMessage>
            {preferencesText.loginMessageConfiguredInSettings()}
          </WarningMessage>
        )}
        {loadError !== undefined && <ErrorMessage>{loadError}</ErrorMessage>}
        {saveError !== undefined && <ErrorMessage>{saveError}</ErrorMessage>}
        {saveSucceeded && (
          <div className="rounded border border-green-500/60 bg-green-50 p-3 text-green-800 dark:border-green-500 dark:bg-green-900/30 dark:text-green-200">
            {preferencesText.loginMessageSaved()}
          </div>
        )}
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Label.Inline className="items-center gap-2">
            <Input.Checkbox
              checked={draft.enabled}
              disabled={isLocked}
              onValueChange={handleEnabledChange}
            />
            {preferencesText.loginMessageEnableLabel()}
          </Label.Inline>
          <Label.Block className="flex flex-col gap-2">
            {preferencesText.loginMessageHtmlLabel()}
            <Textarea
              autoGrow
              disabled={isLocked}
              rows={6}
              value={draft.html}
              onValueChange={handleHtmlChange}
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-300">
              {preferencesText.loginMessageLimit()} ({byteLength}/{MAX_BYTES})
            </span>
          </Label.Block>
          <section className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold">
              {preferencesText.loginMessagePreview()}
            </h3>
            <div
              className="rounded border border-neutral-200 bg-white p-4 text-neutral-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              dangerouslySetInnerHTML={
                sanitizedPreview === ''
                  ? undefined
                  : { __html: sanitizedPreview }
              }
            >
              {sanitizedPreview === '' &&
                preferencesText.loginMessageEmptyPreview()}
            </div>
          </section>
          <div className="flex justify-end">
            <Submit.Save disabled={!isDirty || isSaving}>
              {commonText.save()}
            </Submit.Save>
          </div>
        </Form>
      </Container.Center>
    </Container.FullGray>
  );
}
