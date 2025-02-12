import { Relationship } from '../DataModel/specifyField';

export const shouldBeToOne = (
  relationship: Relationship | undefined
): boolean =>
  relationship?.type.includes('-to-many') === false ||
  (relationship?.type.includes('-to-many') === true &&
    !relationship.isDependent() &&
    relationship.getReverse()?.isDependent() === true);
