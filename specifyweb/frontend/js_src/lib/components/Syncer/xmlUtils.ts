import type { LocalizedString } from 'typesafe-i18n';

import { f } from '../../utils/functools';
import { parseBoolean } from '../../utils/parser/parse';
import type { BaseSpec } from './index';
import type { SimpleXmlNode, XmlNode } from './xmlToJson';

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
    value.length === 0 ? undefined : (value as LocalizedString)
  );

export const getBooleanAttribute = (
  cell: SimpleXmlNode | XmlNode,
  name: string
): boolean | undefined => f.maybe(getParsedAttribute(cell, name), parseBoolean);

/** Convert <a></a> to <a /> */
const reEmptyTag = /<(?<name>[^\s/>]+)(?<attributes>[^<>]*)><\/\k<name>>/gu;

export const xmlToString = (xml: Node): string =>
  new XMLSerializer()
    .serializeToString(xml)
    .replaceAll(reEmptyTag, '<$<name>$<attributes> />');

export const createXmlSpec = <SPEC extends BaseSpec<SimpleXmlNode>>(
  spec: SPEC
): SPEC => spec;
