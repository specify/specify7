import { RA } from '../../utils/types';

export const urlSpec = {
  preparations: '/statistics/collection/preparations/',
  typeSpecimens: '/statistics/collection/type_specimens/',
  holdings: '/statistics/collection/holdings/',
  localityGeography: '/statistics/collection/locality_geography/',
};

export const unknownCategories: RA<string> = ['preparations', 'typeSpecimens'];
