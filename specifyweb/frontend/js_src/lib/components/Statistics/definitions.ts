import { RA } from '../../utils/types';
import { statsSpec } from './StatsSpec';

export const urlSpec = {
  preparations: '/statistics/collection/preparations/',
  typeSpecimens: '/statistics/collection/type_specimens/',
  holdings: '/statistics/collection/holdings/',
  localityGeography: '/statistics/collection/locality_geography/',
};

export const unknownCategories: RA<keyof typeof statsSpec[string]> = [
  'preparations',
  'typeSpecimens',
];

export const labelIndexMatchReGenerator = (itemLabel: string): RegExp =>
  new RegExp(`^\\s*${itemLabel}\\s*\\(\\s*(\\d+)\\s*\\)\\s*$`, 'u');
export const labelMatchReGenerator = (itemLabel: string): RegExp =>
  new RegExp(`${itemLabel}`, 'u');
export const labelSepReGenerator = (itemLabel: string): RegExp =>
  new RegExp(`^\\s*${itemLabel}\\s*$`, 'u');
