import { ajax } from './ajax';
import type { DatasetBrief } from './components/wbplanview';
import type { RA } from './types';
import { filterArray } from './types';
import { escapeRegExp } from './helpers';
import { f } from './functools';

const MAX_NAME_LENGTH = 64;

export function getUniqueName(
  name: string,
  usedNames: RA<string>,
  // Can get this number from SQL schema for a given field
  maxLength: number = Number.POSITIVE_INFINITY
): string {
  if (!usedNames.includes(name)) return name;
  const suffix = / \((\d+)\)$/.exec(name);
  const [{ length }, indexString] = suffix ?? ([[], '0'] as const);
  const strippedName = length > 0 ? name.slice(0, -1 * length) : name;
  const indexRegex = new RegExp(`^${escapeRegExp(strippedName)} \\((\\d+)\\)$`);
  const newIndex =
    Math.max(
      ...filterArray([
        f.parseInt(indexString),
        ...usedNames.map((name) =>
          f.parseInt(indexRegex.exec(name)?.[1] ?? '1')
        ),
      ])
    ) + 1;
  const newName =
    newIndex === 1 && length === 0
      ? strippedName
      : `${strippedName} (${newIndex})`;
  return newName.length > maxLength
    ? getUniqueName(
        name.slice(0, -1 * ` (${newIndex})`.length),
        usedNames,
        maxLength
      )
    : newName;
}

export async function uniquifyDataSetName(
  name: string,
  currentDataSetId?: number
): Promise<string> {
  return ajax<RA<DatasetBrief>>(`/api/workbench/dataset/`, {
    headers: { Accept: 'application/json' },
  }).then(({ data: datasets }) =>
    getUniqueName(
      name,
      datasets
        .filter(({ id }) => id !== currentDataSetId)
        .map(({ name }) => name),
      MAX_NAME_LENGTH
    )
  );
}
