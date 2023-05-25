import React from 'react';
import { GetSet } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import { collectionPreferences } from '../Preferences/collectionPreferences';

export const IsQueryBasicContext = React.createContext(false);
IsQueryBasicContext.displayName = 'IsQueryBasicContext';

export function useQueryViewPref(queryId: number): GetSet<boolean> {
  const [isDefaultBasicViewPref] = userPreferences.use(
    'queryBuilder',
    'behavior',
    'displayBasicView'
  );
  const [viewCollectionPref, setViewCollectionPref] = collectionPreferences.use(
    'queryBuilder',
    'appearance',
    'display'
  );
  const isBasic = viewCollectionPref.basicView.includes(queryId)
    ? true
    : viewCollectionPref.detailedView.includes(queryId)
    ? false
    : isDefaultBasicViewPref;

  return [
    isBasic,
    (isBasic) =>
      isBasic
        ? setViewCollectionPref({
            basicView: [...viewCollectionPref.basicView, queryId],
            detailedView: viewCollectionPref.detailedView.filter(
              (id) => id !== queryId
            ),
          })
        : setViewCollectionPref({
            detailedView: [...viewCollectionPref.detailedView, queryId],
            basicView: viewCollectionPref.basicView.filter(
              (id) => id !== queryId
            ),
          }),
  ];
}
