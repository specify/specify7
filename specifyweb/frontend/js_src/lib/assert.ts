export default function (value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

/**
 * Allows throwing errors from expressions, rather than statements
 */
export function error(message: string): never {
  throw new Error(message);
}
