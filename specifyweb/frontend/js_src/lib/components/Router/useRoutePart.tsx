import { useStableLocation } from './RouterState';
import { useLocation } from 'react-router-dom';

export function useRoutePart<T extends string = string>(
  name: string
): readonly [string, (value: T | undefined) => void] {
  const location = useStableLocation(useLocation());
  console.log(location);
  // FIXME: finish this
  return [location.hash];
}
