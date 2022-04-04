import { ajax, handleResponse, Http } from './ajax';
import type { Attachment } from './datamodel';
import { getIcon } from './icons';
import { load } from './initialcontext';
import type { SpecifyResource } from './legacytypes';
import commonText from './localization/common';
import * as querystring from './querystring';
import { schema } from './schema';
import type { IR } from './types';
import { defined } from './types';

type AttachmentSettings = {
  readonly collection: string;
  readonly delete: string;
  readonly getmetadata: string;
  readonly read: string;
  readonly testkey: string;
  readonly token_required_for_get: boolean;
  readonly write: string;
};

let settings: AttachmentSettings | undefined;
export const attachmentSettingsPromise = load<AttachmentSettings | IR<never>>(
  '/context/attachment_settings.json',
  'application/json'
).then((data) => {
  settings = {
    collection: 'sp7demofish',
    token_required_for_get: false,
    read: 'https://demo-assets.specifycloud.org/fileget',
    write: 'https://demo-assets.specifycloud.org/fileupload',
    delete: 'https://demo-assets.specifycloud.org/filedelete',
    getmetadata: 'https://demo-assets.specifycloud.org/getmetadata',
    testkey: 'https://demo-assets.specifycloud.org/testkey',
  };
  // if (Object.keys(data).length > 0) settings = data as AttachmentSettings;
});

export const attachmentsAvailable = (): boolean => typeof settings === 'object';

const thumbnailable = new Set([
  'image/jpeg',
  'image/gif',
  'image/png',
  'image/tiff',
  'application/pdf',
]);

function iconForMimeType(mimetype: string): {
  readonly alt: string;
  readonly src: string;
} {
  if (mimetype === 'text/plain') return { alt: 'text', src: getIcon('text') };
  if (mimetype === 'text/html') return { alt: 'html', src: getIcon('html') };

  const parts = mimetype.split('/');
  const type = parts[0];
  const subtype = parts[1];

  if (['audio', 'video', 'image', 'text'].includes(type))
    return { alt: type, src: getIcon(type) };

  if (type === 'application') {
    const iconName = {
      pdf: 'pdf',
      'vnd.ms-excel': 'MSExcel',
      'vnd.ms-word': 'MSWord',
      'vnd.ms-powerpoint': 'MSPowerPoint',
    }[subtype];

    if (typeof iconName === 'string')
      return { alt: iconName, src: getIcon(iconName) };
  }

  return { alt: commonText('unknown'), src: getIcon('unknown') };
}

const fetchToken = async (filename: string): Promise<string | undefined> =>
  settings?.token_required_for_get === true
    ? ajax(querystring.format('/attachment_gw/get_token/', { filename }), {
        method: 'GET',
        headers: { Accept: 'test/plain' },
      }).then(({ data }) => data)
    : Promise.resolve(undefined);

export async function fetchThumbnail(
  attachment: SpecifyResource<Attachment>,
  scale = 256
): Promise<
  | {
      readonly src: string;
      readonly alt: string;
      readonly width: number;
      readonly height: number;
    }
  | undefined
> {
  const mimetype = attachment.get('mimeType');
  if (typeof mimetype === 'string' && !thumbnailable.has(mimetype))
    return {
      ...iconForMimeType(mimetype),
      width: scale,
      height: scale,
    };

  const attachmentLocation = attachment.get('attachmentLocation');

  return typeof attachmentLocation === 'string'
    ? fetchToken(attachmentLocation).then((token) =>
        typeof settings === 'object'
          ? {
              src: querystring.format(settings.read, {
                coll: settings.collection,
                type: 'T',
                filename: attachmentLocation,
                scale: scale.toString(),
                ...(typeof token === 'string' ? { token } : {}),
              }),
              alt: attachmentLocation,
              width: scale,
              height: scale,
            }
          : undefined
      )
    : undefined;
}

export const formatAttachmentUrl = (
  attachment: SpecifyResource<Attachment>,
  token: string | undefined
): string | undefined =>
  typeof settings === 'object'
    ? querystring.format(settings.read, {
        coll: settings.collection,
        type: 'O',
        filename: attachment.get('attachmentLocation'),
        downloadname: attachment.get('origFilename')?.replace(/^.*[/\\]/, ''),
        ...(typeof token === 'string' ? { token } : {}),
      })
    : undefined;

export async function fetchOriginalUrl(
  attachment: SpecifyResource<Attachment>
): Promise<string | undefined> {
  const attachmentLocation = attachment.get('attachmentLocation');

  return typeof attachmentLocation === 'string'
    ? fetchToken(attachmentLocation).then((token) =>
        formatAttachmentUrl(attachment, token)
      )
    : Promise.resolve(undefined);
}

export const uploadFile = async (
  file: File,
  handleProgress: (percentage: number | undefined) => void
): Promise<SpecifyResource<Attachment> | undefined> =>
  typeof settings === 'object'
    ? ajax<
        Partial<{ readonly token: string; readonly attachmentlocation: string }>
      >(
        querystring.format('/attachment_gw/get_upload_params/', {
          filename: file.name,
        }),
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      ).then(({ data }) => {
        if (
          typeof data.attachmentlocation === 'undefined' ||
          typeof data.token === 'undefined' ||
          typeof settings === 'undefined'
        )
          return undefined;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('token', data.token);
        formData.append('store', data.attachmentlocation);
        formData.append('type', 'O');
        formData.append('coll', settings.collection);

        /*
         * Using XMLHttpRequest rather than fetch() because need upload
         * progress reporting, which is not yet supported by fetch API
         */
        const xhr = new XMLHttpRequest();
        xhr.upload?.addEventListener('progress', (event) =>
          handleProgress(
            event.lengthComputable ? event.loaded / event.total : undefined
          )
        );
        xhr.open('POST', settings.write);
        xhr.send(formData);
        const DONE = 4;
        return new Promise((resolve) =>
          xhr.addEventListener('readystatechange', () =>
            xhr.readyState === DONE
              ? resolve(
                  handleResponse({
                    expectedResponseCodes: [Http.OK],
                    accept: undefined,
                    response: {
                      ok: xhr.status === Http.OK,
                      status: xhr.status,
                      url: defined(settings).write,
                    } as Response,
                    strict: true,
                    text: xhr.responseText,
                  })
                )
              : undefined
          )
        ).then(
          () =>
            new schema.models.Attachment.Resource({
              attachmentlocation: data.attachmentlocation,
              mimetype: file.type,
              origfilename: file.name,
            })
        );
      })
    : Promise.resolve(undefined);
