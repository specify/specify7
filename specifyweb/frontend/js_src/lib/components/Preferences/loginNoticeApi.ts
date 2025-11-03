import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';

export type LoginNoticeSettings = {
  readonly enabled: boolean;
  readonly content: string;
  readonly updated_at: string;
};

export type LoginNoticeUpdate = {
  readonly enabled: boolean;
  readonly content: string;
};

export async function fetchLoginNoticeSettings(): Promise<LoginNoticeSettings> {
  const { data } = await ajax<LoginNoticeSettings>('/context/login_notice/manage/', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    errorMode: 'dismissible',
  });
  return data;
}

export async function updateLoginNoticeSettings(
  payload: LoginNoticeUpdate
): Promise<LoginNoticeSettings> {
  const { data } = await ajax<LoginNoticeSettings>('/context/login_notice/manage/', {
    method: 'PUT',
    body: payload,
    headers: { Accept: 'application/json' },
    errorMode: 'dismissible',
    expectedErrors: [Http.BAD_REQUEST, Http.FORBIDDEN],
  });
  return data;
}
