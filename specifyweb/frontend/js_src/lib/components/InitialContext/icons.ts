/**
 * Various icons
 *
 * Icons are stored in https://github.com/specify/specify6/tree/master/src/edu/ku/brc/specify/images
 */

import type { RA } from '../../utils/types';
import { softFail } from '../Errors/Crash';
import { load } from './index';

const iconGroups = {} as Record<IconGroup, Document>;

export const fetchContext = Promise.all(
  Object.entries({
    /**
     * These files are defined in Specify 6 code here:
     * https://github.com/specify/specify6/blob/master/config/
     */
    datamodel: 'icons_datamodel.xml',
    discipline: 'icons_disciplines.xml',
    imgproc: 'icons_imgproc.xml',
    plugin: 'icons_plugins.xml',
    default: 'icons.xml',
  }).map(async ([iconGroup, fileName]) =>
    load<Document>(`/static/config/${fileName}`, 'text/xml').then((xml) => {
      iconGroups[iconGroup] = xml;
    })
  )
);

type IconGroup = keyof typeof iconDirectories;

const iconDirectories = {
  datamodel: '/images/datamodel/',
  discipline: '/images/discipline/',
  imgproc: '/images/imgproc/',
  plugin: '/images/',
  default: '/images/',
};

export const unknownIcon = '/images/unknown.png';

export function getIcon(name: string): string | undefined {
  for (const [group, xml] of Object.entries(iconGroups)) {
    const iconFile = findIconInXml(name, xml)?.getAttribute('file');
    if (typeof iconFile === 'string')
      return `${iconDirectories[group]}${iconFile}`;
  }
  try {
    new URL(name);
    return name;
  } catch {}
  console.warn(`Unable to find the icon ${name}`);
  return undefined;
}

function findIconInXml(
  icon: string,
  xml: Document,
  cycleDetect: RA<string> = []
): Element | undefined {
  if (cycleDetect.includes(icon)) {
    softFail(new Error('Circular reference in icon definitions'));
    return undefined;
  }
  const iconNode = xml.querySelector(
    `icon[name="${icon}"],icon[file="${icon}"]`
  );
  const alias = iconNode?.getAttribute('alias');
  return typeof alias === 'string'
    ? findIconInXml(alias, xml, [...cycleDetect, icon])
    : iconNode ?? undefined;
}
