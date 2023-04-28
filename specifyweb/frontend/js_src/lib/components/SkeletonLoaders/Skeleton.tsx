import { commonText } from '../../localization/common';
import { wrap } from '../Atoms/wrapper';

const skeleton = `bg-gray-200 dark:bg-neutral-600 [body:not(.reduce-motion)_&]:animate-pulse`;

export const Skeleton = {
  Root: wrap('Skeleton.Root', 'div', 'flex gap-4', {
    'aria-label': commonText.loading(),
  }),
  Line: wrap('Skeletons.Line', 'div', `${skeleton} h-4 w-14 rounded`),
  LongLine: wrap('Skeletons.LongLine', 'div', `${skeleton} h-4 rounded`),
  Square: wrap('Skeletons.Square', 'div', `${skeleton} h-32 rounded`),
  SmallSquare: wrap(
    'Skeletons.SmallSquare',
    'div',
    `${skeleton} h-6 w-6 rounded`
  ),
  Rectangle: wrap('Skeletons.Rectangle', 'div', `${skeleton} h-6 w-64 rounded`),
  SmallRectangle: wrap(
    'Skeletons.SmallRectangle',
    'div',
    `${skeleton} h-6 w-16 rounded`
  ),
  TallRectangle: wrap(
    'Skeletons.TallRectangle',
    'div',
    `${skeleton} w-32 rounded`
  ),
  ThinRectangle: wrap(
    'Skeletons.ThinRectangle',
    'div',
    `${skeleton} w-32 w-6 rounded`
  ),
  SmallCircle: wrap(
    'Skeletons.SmallCircle',
    'div',
    `${skeleton} w-6 rounded-full`
  ),
};
