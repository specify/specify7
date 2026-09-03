import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { XMLParser } from 'fast-xml-parser';

type RegistryEntry = {
  readonly identifier: string;
  readonly url: string;
  readonly title: string;
  readonly description?: string;
  readonly subject?: string | null;
  readonly issued?: string;
  readonly isLatest?: boolean;
};

type Registry = { readonly extensions: readonly RegistryEntry[] };

type XmlAttributes = Readonly<Record<string, string>>;
type XmlNode = {
  readonly [key: string]: unknown;
  readonly ':@'?: XmlAttributes;
};

type CatalogField = {
  readonly name: string;
  readonly title: string;
  readonly required: boolean;
  readonly description?: string;
  readonly vocabulary?: string;
  readonly iri: string;
  readonly group?: string;
};

type CatalogDefinition = {
  readonly name: string;
  readonly title: string;
  readonly identifier: string;
  readonly url: string;
  readonly rowType: string;
  readonly namespace: string;
  readonly issued?: string;
  readonly description?: string;
  readonly subject: string;
  readonly fields: readonly CatalogField[];
};

const registryUrl = 'https://rs.gbif.org/extensions.json';
const outputDirectory = resolve(
  process.cwd(),
  'lib/components/ExportFeed/data'
);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  preserveOrder: true,
  processEntities: false,
});

function getChildren(node: XmlNode, name: string): readonly XmlNode[] {
  const children = node[name];
  return Array.isArray(children)
    ? children.filter((child): child is XmlNode => typeof child === 'object')
    : [];
}

function attributes(node: XmlNode | undefined): XmlAttributes {
  return node?.[':@'] ?? {};
}

function parseDefinition(entry: RegistryEntry, xml: string): CatalogDefinition {
  const root = parser.parse(xml).find((node: XmlNode) => node.extension);
  if (root === undefined)
    throw new Error(`No extension element in ${entry.url}`);

  const rootAttributes = attributes(root);
  const properties = getChildren(root, 'extension');
  if (properties.length === 0)
    throw new Error(`Invalid definition ${entry.url}`);

  const fields = properties.map((property) => {
    const fieldAttributes = attributes(property);
    const name =
      fieldAttributes['@_qualName'] ??
      `${fieldAttributes['@_namespace'] ?? ''}${fieldAttributes['@_name'] ?? ''}`;
    return {
      name,
      title: fieldAttributes['@_label'] ?? fieldAttributes['@_name'] ?? name,
      required: fieldAttributes['@_required'] === 'true',
      description: fieldAttributes['@_dc:description'] ?? '',
      vocabulary: fieldAttributes['@_namespace'] ?? '',
      iri: name,
      group: fieldAttributes['@_group'] ?? '',
    };
  });

  return {
    name: rootAttributes['@_name'] ?? entry.identifier,
    title: rootAttributes['@_dc:title'] ?? entry.title,
    identifier: entry.identifier,
    url: entry.url,
    rowType: rootAttributes['@_rowType'] ?? entry.identifier,
    namespace: rootAttributes['@_namespace'] ?? '',
    ...(rootAttributes['@_dc:issued'] === undefined
      ? {}
      : { issued: rootAttributes['@_dc:issued'] }),
    ...(rootAttributes['@_dc:description'] === undefined
      ? {}
      : { description: rootAttributes['@_dc:description'] }),
    subject: entry.subject ?? '',
    fields,
  };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function main(): Promise<void> {
  const registry = JSON.parse(await fetchText(registryUrl)) as Registry;
  const latest = registry.extensions.filter((entry) => entry.isLatest === true);
  const definitions = await Promise.all(
    latest.map(async (entry) =>
      parseDefinition(entry, await fetchText(entry.url))
    )
  );

  const cores = definitions.filter((definition) =>
    definition.url.includes('/core/')
  );
  const extensions = definitions.filter((definition) =>
    definition.url.includes('/extension/')
  );

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(outputDirectory, 'gbifCores.json'),
      `${JSON.stringify(cores, null, 2)}\n`
    ),
    writeFile(
      resolve(outputDirectory, 'gbifExtensions.json'),
      `${JSON.stringify(extensions, null, 2)}\n`
    ),
  ]);

  console.log(
    `Wrote ${cores.length} cores and ${extensions.length} extensions`
  );
}

void main();
