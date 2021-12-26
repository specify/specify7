import ajax from './ajax';
import type { DatasetBrief, RA } from './components/wbplanview';

const MAX_NAME_LENGTH = 64;

function addSuffix(name: string, usedNames: RA<string>): string {
  let newName = name;
  for (let index = 0; usedNames.includes(newName); index += 1) {
    const suffix = ` (${index})`;
    index += 1;
    newName =
      name.slice(0, Math.max(0, MAX_NAME_LENGTH - suffix.length)) + suffix;
  }
  return newName;
}

export default async function uniquifyDataSetName(
  name: string,
  currentDataSetId?: number
): Promise<string> {
  const trimmedName = name.trim().slice(0, MAX_NAME_LENGTH);

  return ajax<RA<DatasetBrief>>(`/api/workbench/dataset/`).then(
    ({ data: datasets }) => {
      const usedNames = datasets
        .filter(({ id }) => id !== currentDataSetId)
        .map(({ name }) => name);
      return addSuffix(trimmedName, usedNames);
    }
  );
}
