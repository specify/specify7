// Turn 'table.field' keys to nested objects to send to the backend
function setNested(
  object: Record<string, any>,
  path: string,
  value: any
): void {
  const index = path.indexOf('.');
  if (index === -1) {
    object[path] = value;
    return;
  }
  const head = path.slice(0, index);
  const rest = path.slice(index + 1);
  if (
    object[head] === undefined ||
    typeof object[head] !== 'object' ||
    Array.isArray(object[head])
  ) {
    object[head] = {};
  }
  setNested(object[head], rest, value);
}

function flattenToNested(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key.includes('.')) {
      setNested(result, key, value);
    } else {
      result[key] = value;
    }
  });
  return result;
}

export function flattenAllResources(
  data: Record<string, any>
): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] = flattenToNested(value);
  });
  return result;
}
