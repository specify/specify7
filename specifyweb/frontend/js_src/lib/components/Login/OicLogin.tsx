/**
 * Login screen when using third party identity providers
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useSearchParameter } from '../../hooks/navigation';
import { userText } from '../../localization/user';
import type { Language } from '../../localization/utils/config';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form } from '../Atoms/Form';
import { Link } from '../Atoms/Link';
import { Submit } from '../Atoms/Submit';
import { SplashScreen } from '../Core/SplashScreen';
import { formatUrl } from '../Router/queryString';
import { LoginLanguageChooser } from './index';

export type OicProvider = {
  readonly provider: string;
  readonly title: LocalizedString;
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
      <LoginLanguageChooser languages={data.languages} />
      <Form forwardRef={formRef} method="post">
        {typeof data.inviteToken === 'object' && (
          <p>
            {userText.helloMessage({ userName: data.inviteToken.username })}
            <br />
            {userText.oicWelcomeMessage()}
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
          >
            {userText.legacyLogin()}
          </Link.Fancy>
        )}
        <input name="next" type="hidden" value={nextUrl} />
        <Submit.Fancy className="sr-only">{userText.logIn()}</Submit.Fancy>
      </Form>
    </SplashScreen>
  );
}
