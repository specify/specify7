/**
 * WB Upload results Typings
 *
 * @module
 */

import type { LocalizedString } from 'typesafe-i18n';

import type { IR } from '../../utils/types';
import { localized } from '../../utils/types';
import {
  resolveAttachmentValidationMessageByKey,
  resolveBackendBusinessRuleMessage,
  resolveBackendParsingMessage,
  resolveSpecificValidationMessage,
} from './resultMessageResolvers';
export type { UploadResult } from './uploadResultTypes';

/** Back-end sends a validation key. Front-end translates it */
export function resolveValidationMessage(
  key: string,
  payload: IR<unknown>
): LocalizedString {
  const isBusinessRule = typeof payload.localizationKey === 'string';
  const baseParsedMessage = resolveBackendParsingMessage(key, payload);
  const businessRuleMessage = resolveBackendBusinessRuleMessage(key, payload);
  if (baseParsedMessage !== undefined) {
    return baseParsedMessage;
  } else if (businessRuleMessage !== undefined) {
    return businessRuleMessage;
  }

  const specificValidationMessage = resolveSpecificValidationMessage(
    key,
    payload
  );
  if (specificValidationMessage !== undefined) {
    return specificValidationMessage;
  }
  if (isBusinessRule) return localized(key);

  // This can happen for data sets created before 7.8.2
  return localized(
    `${key}${
      Object.keys(payload).length === 0 ? '' : ` ${JSON.stringify(payload)}`
    }`
  );
}

export function resolveAttachmentValidationMessage(
  key: string
): LocalizedString {
  return resolveAttachmentValidationMessageByKey(key);
}
