import type Handsontable from 'handsontable';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { type RA } from '../../utils/types';
import { LoadingContext } from '../Core/Contexts';
import type { AnySchema } from '../DataModel/helperTypes';
import type { Collection } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import { Dialog } from '../Molecules/Dialog';
import { hasTablePermission } from '../Permissions/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { DisambiguationDialog } from './Disambiguation';
import type { Disambiguation } from './DisambiguationLogic';
import { getSelectedLast } from './hotHelpers';
import type { WbMapping } from './mapping';
import type { WbValidation } from './WbValidation';

type DisambiguationMatches = {
  readonly physicalCols: RA<number>;
  readonly mappingPath: MappingPath;
  readonly ids: RA<number>;
  readonly key: string;
};

export function useDisambiguationDialog({
  hot,
  data,
  disambiguation,
  mappings,
  validation,
}: {
  readonly data: RA<RA<string | null>>;
  readonly validation: WbValidation;
  readonly disambiguation: Disambiguation;
  readonly mappings: WbMapping | undefined;
  readonly hot: Handsontable | undefined;
}): {
  readonly openDisambiguationDialog: () => void;
  readonly disambiguationDialogs: JSX.Element;
} {
  const [disambiguationMatches, setDisambiguationMatches] =
    React.useState<DisambiguationMatches>();
  const [disambiguationPhysicalRow, setPhysicalRow] = React.useState<number>();
  const [disambiguationResource, setResource] =
    React.useState<Collection<AnySchema>>();
  const [
    noDisambiguationDialog,
    openNoDisambiguationDialog,
    closeNoDisambiguationDialog,
  ] = useBooleanState();

  const [disambiguationDialog, openDisambiguation, closeDisambiguation] =
    useBooleanState();

  const loading = React.useContext(LoadingContext);

  const openDisambiguationDialog = React.useCallback(() => {
    if (mappings === undefined || hot === undefined) return;

    const [visualRow, visualCol] = getSelectedLast(hot);
    const physicalRow = hot.toPhysicalRow(visualRow);
    const physicalCol = hot.toPhysicalColumn(visualCol);

    const matches = validation.uploadResults.ambiguousMatches[physicalRow].find(
      ({ physicalCols }) => physicalCols.includes(physicalCol)
    );
    if (matches === undefined) return;
    const tableName = getTableFromMappingPath(
      mappings.baseTable.name,
      matches.mappingPath
    );
    const table = strictGetTable(tableName);
    const resources = new table.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    }) as Collection<AnySchema>;

    loading(
      (hasTablePermission(table.name, 'read')
        ? resources.fetch({ limit: 0 })
        : Promise.resolve(resources)
      ).then(({ models }) => {
        if (models.length === 0) {
          openNoDisambiguationDialog();
          return;
        }
        setDisambiguationMatches(matches);
        setResource(resources);
        setPhysicalRow(physicalRow);
        openDisambiguation();
      })
    );
  }, [mappings, hot]);

  const disambiguationDialogs = (
    <>
      {noDisambiguationDialog && (
        <Dialog
          buttons={commonText.close()}
          header={wbText.noDisambiguationResults()}
          onClose={closeNoDisambiguationDialog}
        >
          {wbText.noDisambiguationResultsDescription()}
        </Dialog>
      )}
      {disambiguationDialog && (
        <DisambiguationDialog
          liveValidationStack={validation.liveValidationStack}
          matches={disambiguationResource!.models}
          onClose={closeDisambiguation}
          onSelected={(selected) => {
            disambiguation.setDisambiguation(
              disambiguationPhysicalRow!,
              disambiguationMatches!.mappingPath,
              selected.id
            );
            validation.startValidateRow(disambiguationPhysicalRow!);
            hot?.render();
          }}
          onSelectedAll={(selected): void =>
            // Loop backwards so the live validation will go from top to bottom
            hot?.batch(() => {
              for (
                let visualRow = data.length - 1;
                visualRow >= 0;
                visualRow--
              ) {
                const physicalRow = hot.toPhysicalRow(visualRow);
                const ambiguousMatchToDisambiguate =
                  validation.uploadResults.ambiguousMatches[physicalRow]?.find(
                    ({ key, mappingPath }) =>
                      key === disambiguationMatches!.key &&
                      typeof disambiguation.getDisambiguation(physicalRow)[
                        mappingPathToString(mappingPath)
                      ] !== 'number'
                  );

                if (ambiguousMatchToDisambiguate !== undefined) {
                  disambiguation.setDisambiguation(
                    physicalRow,
                    ambiguousMatchToDisambiguate.mappingPath,
                    selected.id
                  );
                  validation.startValidateRow(physicalRow);
                }
              }
            })
          }
        />
      )}
    </>
  );

  return { openDisambiguationDialog, disambiguationDialogs };
}
