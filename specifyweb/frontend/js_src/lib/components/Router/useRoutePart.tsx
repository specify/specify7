import { useStableLocation } from './RouterState';
import { useLocation } from 'react-router-dom';
import { GetOrSet } from '../../utils/types';

export function useRoutePart(name: string): GetOrSet<string> {
  const location = useStableLocation(useLocation());
  return [location];
}
