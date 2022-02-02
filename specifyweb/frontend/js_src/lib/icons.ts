import { load } from './initialcontext';
import type { RA } from './types';

const iconGroups = {} as Record<IconGroup, Document>;

export const fetchContext = Promise.all(
  Object.entries({
    datamodel: 'icons_datamodel.xml',
    discipline: 'icons_disciplines.xml',
    imgproc: 'icons_imgproc.xml',
    plugin: 'icons_plugins.xml',
    default: 'icons.xml',
  }).map(async ([iconGroup, fileName]) =>
    load<Document>(`/static/config/${fileName}`, 'application/xml').then(
      (xml) => {
        iconGroups[iconGroup as IconGroup] = xml;
      }
    )
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

function findIconInXml(
  icon: string,
  xml: Document,
  cycleDetect: RA<string> = []
): Element | undefined {
  if (cycleDetect.includes(icon))
    throw new Error('Circular reference in icon definitions');
  const iconNode = xml.querySelector(`icon[name="${icon}"]`);
  const alias = iconNode?.getAttribute('alias') ?? undefined;
  return typeof alias === 'string'
    ? findIconInXml(alias, xml, [...cycleDetect, icon])
    : iconNode ?? undefined;
}

export function getIcon(icon: string): string {
  for (const [group, xml] of Object.entries(iconGroups)) {
    const iconFile =
      findIconInXml(icon, xml)?.getAttribute('file') ?? undefined;
    if (typeof iconFile === 'string')
      return `${iconDirectories[group as IconGroup]}${iconFile}`;
  }
  console.warn('unknown icon:', icon);
  return '/images/unknown.png';
}
