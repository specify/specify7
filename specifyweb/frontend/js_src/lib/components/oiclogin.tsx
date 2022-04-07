import React from 'react';

import commonText from '../localization/common';
import type { Language } from '../localization/utils';
import { enabledLanguages, LANGUAGE } from '../localization/utils';
import type { RA } from '../types';
import { Button, className, Form, Link, Submit } from './basic';
import { useTitle } from './hooks';
import { SplashScreen } from './splashscreen';
import { handleLanguageChange, LanguageSelection } from './toolbar/language';

export type OicProvider = {
  readonly provider: string;
  readonly title: string;
};

export function OicLogin({
  data,
  nextUrl,
}: {
  readonly data: {
    readonly inviteToken: '' | { readonly username: string };
    readonly providers: RA<OicProvider>;
    readonly languages: RA<Readonly<[code: Language, name: string]>>;
    readonly csrfToken: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  useTitle(commonText('login'));

  const providerRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  return (
    <SplashScreen>
      <LanguageSelection
        languages={Object.fromEntries(
          data.languages.filter(([code]) => enabledLanguages.includes(code))
        )}
        value={LANGUAGE}
        onChange={handleLanguageChange}
      />
      <Form method="post" forwardRef={formRef}>
        {typeof data.inviteToken === 'object' && (
          <p>{commonText('oicWelcomeMessage')(data.inviteToken.username)}</p>
        )}
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={data.csrfToken}
        />
        <input
          type="hidden"
          name="provider"
          ref={providerRef}
          defaultValue={data.providers[0].provider}
        />
        {data.providers.map(({ provider, title }) => (
          <Button.Fancy
            key={provider}
            onClick={(): void => {
              if (providerRef.current === null) return;
              providerRef.current.value = provider;
              formRef.current?.submit();
            }}
          >
            {title}
          </Button.Fancy>
        ))}
        {data.inviteToken === '' && (
          <Link.LikeFancyButton
            className={className.fancyButton}
            href="/accounts/legacy_login/"
          >
            {commonText('legacyLogin')}
          </Link.LikeFancyButton>
        )}
        <input type="hidden" name="next" value={nextUrl} />
        <Submit.Fancy className="sr-only">{commonText('login')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
