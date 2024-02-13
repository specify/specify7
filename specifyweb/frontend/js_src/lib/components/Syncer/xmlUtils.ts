import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { IR } from '../../utils/types';
import { localized } from '../../utils/types';
import type { BaseSpec, SpecToJson } from './index';
import { runParser } from './index';
import type { SimpleXmlNode, XmlNode } from './xmlToJson';
import { toSimpleXmlNode, xmlToJson } from './xmlToJson';

/** Get XML node attribute in a case-insensitive way */
export const getAttribute = (
  { attributes }: SimpleXmlNode | XmlNode,
  name: string
): string | undefined => attributes[name] ?? attributes[name.toLowerCase()];

/** Like getAttribute, but also trim the value and discard empty values */
export const getParsedAttribute = (
  cell: SimpleXmlNode | XmlNode,
  name: string
): LocalizedString | undefined =>
  f.maybe(getAttribute(cell, name)?.trim(), (value) =>
    value.length === 0 ? undefined : localized(value)
  );

export const getBooleanAttribute = (
  cell: SimpleXmlNode | XmlNode,
  name: string
): boolean | undefined => f.maybe(getParsedAttribute(cell, name), parseBoolean);

export const createXmlSpec = <SPEC extends BaseSpec<SimpleXmlNode>>(
  spec: SPEC
): SPEC => spec;

export const xmlToSpec = <SPEC extends BaseSpec<SimpleXmlNode>>(
  xml: Element,
  spec: SPEC
): SpecToJson<SPEC> => runParser(spec, toSimpleXmlNode(xmlToJson(xml)));

/**
 * This is used to keep track of unknown attributes only. I.e, if an attribute
 * that is not in the spec was present during serialization, than add it back
 * during deserialization. This way, for example, form spec does not need to
 * define all of the Specify 6 attributes that Specify 7 does not support.
 *
 * If you explicitly need access to an old value in a deserializer, modify
 * your serializer to include the old value in it.
 */
const symbolSyncerRaw: unique symbol = Symbol('Syncer Raw object');

export const getOriginalSyncerInput = <T extends IR<unknown> = SimpleXmlNode>(
  updated: T
): XmlNode | undefined =>
  Object.getOwnPropertyDescriptor(updated, symbolSyncerRaw)?.value;

export const setOriginalSyncerInput = <IN extends IR<unknown>>(
  result: IN,
  raw: XmlNode | undefined
): IN =>
  Object.defineProperty(result, symbolSyncerRaw, {
    value: raw,
    // To not error out if parser is run twice on the same object
    writable: true,
    // To preserve it on spread
    enumerable: true,
  });
