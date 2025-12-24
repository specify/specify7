import { type RA } from '../../utils/types';
import { load } from '../InitialContext';

export type InstitutionData = {
  readonly id: number;
  readonly name: string;
  readonly children: RA<{
    // Division
    readonly id: number;
    readonly name: string;
    readonly children: RA<{
      // Discipline
      readonly id: number;
      readonly name: string;
      readonly children: RA<{
        // Collection
        readonly id: number;
        readonly name: string;
      }>;
      readonly geographytreedef: number | null;
      readonly taxontreedef: number | null;
    }>;
  }>;
};

let institutionData: InstitutionData;

export const fetchAllSystemData = load<InstitutionData>(
  '/context/all_system_data.json',
  'application/json'
).then((data: InstitutionData) => {
  institutionData = data;
  return data;
});

export const getAllInfo = (): InstitutionData => institutionData;
