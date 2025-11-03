import React from 'react';

import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { ErrorMessage } from '../Atoms';
import { Input, Label, Textarea } from '../Atoms/Form';
import {
  fetchLoginNoticeSettings,
  updateLoginNoticeSettings,
} from './loginNoticeApi';

export type LoginNoticeState = {
  readonly enabled: boolean;
  readonly content: string;
};

type LoginNoticeEditorResult = {
  readonly state: LoginNoticeState | undefined;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly error: string | undefined;
  readonly hasChanges: boolean;
  readonly setEnabled: (enabled: boolean) => void;
  readonly setContent: (value: string) => void;
  readonly save: () => Promise<void>;
};

export function useLoginNoticeEditor(): LoginNoticeEditorResult {
  const [state, setState] = React.useState<LoginNoticeState | undefined>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const initialRef = React.useRef<LoginNoticeState | undefined>();

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchLoginNoticeSettings()
      .then((data) => {
        if (!isMounted) return;
        const sanitized: LoginNoticeState = {
          enabled: data.enabled,
          content: data.content,
        };
        initialRef.current = sanitized;
        setState(sanitized);
        setError(undefined);
      })
      .catch((fetchError) => {
        console.error('Failed to load login notice settings', fetchError);
        if (isMounted) setError(preferencesText.loginPageNoticeLoadError());
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const hasChanges =
    state !== undefined &&
    initialRef.current !== undefined &&
    (initialRef.current.enabled !== state.enabled ||
      initialRef.current.content !== state.content);

  const setEnabled = React.useCallback((enabled: boolean) => {
    setState((previous) =>
      typeof previous === 'object'
        ? { ...previous, enabled }
        : { enabled, content: '' }
    );
  }, []);

  const setContent = React.useCallback((value: string) => {
    setState((previous) =>
      typeof previous === 'object'
        ? {
            ...previous,
            content: value,
          }
        : { enabled: false, content: value }
    );
  }, []);

  const save = React.useCallback(async () => {
    if (!hasChanges || state === undefined) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const updated = await updateLoginNoticeSettings(state);
      const sanitized: LoginNoticeState = {
        enabled: updated.enabled,
        content: updated.content,
      };
      initialRef.current = sanitized;
      setState(sanitized);
    } catch (saveError) {
      console.error('Failed to save login notice', saveError);
      setError(preferencesText.loginPageNoticeSaveError());
      throw saveError;
    } finally {
      setIsSaving(false);
    }
  }, [hasChanges, state]);

  return {
    state,
    isLoading,
    isSaving,
    error,
    hasChanges,
    setEnabled,
    setContent,
    save,
  };
}

export function LoginNoticeForm({
  description,
  error,
  successMessage,
  isLoading,
  isSaving,
  state,
  onEnabledChange,
  onContentChange,
  savingLabel,
}: {
  readonly description?: string;
  readonly error?: string;
  readonly successMessage?: string;
  readonly isLoading: boolean;
  readonly isSaving: boolean;
  readonly state: LoginNoticeState | undefined;
  readonly onEnabledChange: (enabled: boolean) => void;
  readonly onContentChange: (content: string) => void;
  readonly savingLabel?: string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      {description !== undefined && (
        <p className="text-gray-500">{description}</p>
      )}
      {error !== undefined && <ErrorMessage>{error}</ErrorMessage>}
      {successMessage !== undefined && error === undefined && (
        <p className="rounded border border-green-200 bg-green-50 p-2 text-green-800 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-100">
          {successMessage}
        </p>
      )}
      {isLoading || state === undefined ? (
        <p>{commonText.loading()}</p>
      ) : (
        <>
          <Label.Inline>
            <Input.Checkbox
              checked={state.enabled}
              disabled={isSaving}
              onValueChange={onEnabledChange}
            />
            {preferencesText.loginPageNoticeEnabled()}
          </Label.Inline>
          <Textarea
            autoGrow
            disabled={isSaving}
            placeholder={preferencesText.loginPageNoticePlaceholder()}
            rows={6}
            value={state.content}
            onValueChange={onContentChange}
          />
          {isSaving && (
            <p>{savingLabel ?? preferencesText.loginPageNoticeSaving()}</p>
          )}
        </>
      )}
    </div>
  );
}
