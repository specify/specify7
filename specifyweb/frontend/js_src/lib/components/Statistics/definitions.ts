import { RA } from '../../utils/types';
import { statsSpec } from './StatsSpec';

export const urlSpec = {
  holdings: '/statistics/collection/holdings/',
  preparations: '/statistics/collection/preparations/',
  typeSpecimens: '/statistics/collection/type_specimens/',
  localityGeography: '/statistics/collection/locality_geography/',
};

export const unknownCategories: RA<keyof typeof statsSpec[string]> = [
  'preparations',
  'typeSpecimens',
];
