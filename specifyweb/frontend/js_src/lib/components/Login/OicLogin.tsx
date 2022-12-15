/**
 * Login screen when using third party identity providers
 */

import React from 'react';

import { commonText } from '../../localization/common';
import type { Language } from '../../localization/utils';
import { enabledLanguages, LANGUAGE } from '../../localization/utils';
import { formatUrl } from '../Router/queryString';
import type { RA } from '../../utils/types';
import { useSearchParameter } from '../../hooks/navigation';
import { handleLanguageChange, LanguageSelection } from '../Toolbar/Language';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { Button } from '../Atoms/Button';
import { SplashScreen } from '../Core/SplashScreen';
import { className } from '../Atoms/className';
import { userText } from '../../localization/user';

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
    readonly languages: RA<readonly [code: Language, name: string]>;
    readonly csrfToken: string;
  };
  readonly nextUrl: string;
}): JSX.Element {
  const providerRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [next = ''] = useSearchParameter('next');
  return (
    <SplashScreen>
      <LanguageSelection<Language>
        languages={Object.fromEntries(
          data.languages.filter(([code]) => enabledLanguages.includes(code))
        )}
        value={LANGUAGE}
        onChange={handleLanguageChange}
      />
      <Form forwardRef={formRef} method="post">
        {typeof data.inviteToken === 'object' && (
          <p>
            {userText('helloMessage', data.inviteToken.username)}
            <br />
            {userText('oicWelcomeMessage')}
          </p>
        )}
        <input
          name="csrfmiddlewaretoken"
          type="hidden"
          value={data.csrfToken}
        />
        <input
          name="provider"
          ref={providerRef}
          type="hidden"
          value={data.providers[0].provider}
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
          <Link.Fancy
            href={formatUrl('/accounts/legacy_login/', {
              next,
            })}
            className={className.navigationHandled}
          >
            {userText('legacyLogin')}
          </Link.Fancy>
        )}
        <input name="next" type="hidden" value={nextUrl} />
        <Submit.Fancy className="sr-only">{commonText('login')}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
