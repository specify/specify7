// Turn 'table.field' keys to nested objects to send to the backend
function flattenToNested(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key.includes('.')) {
      const [prefix, field] = key.split('.', 2);
      result[prefix] ||= {};
      result[prefix][field] = value;
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
