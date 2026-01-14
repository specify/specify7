// Turn 'table.field' keys to nested objects to send to the backend
function setNested(obj: Record<string, any>, path: string, value: any): void {
  const idx = path.indexOf('.');
  if (idx === -1) {
    obj[path] = value;
    return;
  }
  const head = path.slice(0, idx);
  const rest = path.slice(idx + 1);
  if (obj[head] === undefined || typeof obj[head] !== 'object' || Array.isArray(obj[head])) {
    obj[head] = {};
  }
  setNested(obj[head], rest, value);
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

export function flattenAllResources(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    result[key] = flattenToNested(value);
  });
  return result;
}
