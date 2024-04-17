import React from 'react';
import Handsontable from 'handsontable';

import { type RA } from '../../utils/types';
import { MappingPath } from '../WbPlanView/Mapper';
import type { Collection } from '../DataModel/specifyTable';
import { AnySchema } from '../DataModel/helperTypes';
import { useBooleanState } from '../../hooks/useBooleanState';
import { getSelectedLast } from './hotHelpers';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { hasTablePermission } from '../Permissions/helpers';
import { strictGetTable } from '../DataModel/tables';
import { WbMapping } from './mapping';
import { WbValidation } from './WbValidation';
import { Dialog } from '../Molecules/Dialog';
import { wbText } from '../../localization/workbench';
import { commonText } from '../../localization/common';
import { DisambiguationDialog } from './Disambiguation';
import { Disambiguation } from './DisambiguationLogic';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { LoadingContext } from '../Core/Contexts';

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
}) {
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
          matches={disambiguationResource!.models}
          liveValidationStack={validation.liveValidationStack}
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
                if (
                  !validation.uploadResults.ambiguousMatches[physicalRow]?.find(
                    ({ key, mappingPath }) =>
                      key === disambiguationMatches!.key &&
                      typeof disambiguation.getDisambiguation(physicalRow)[
                        mappingPathToString(mappingPath)
                      ] !== 'number'
                  )
                )
                  continue;
                disambiguation.setDisambiguation(
                  physicalRow,
                  disambiguationMatches!.mappingPath,
                  selected.id
                );
                validation.startValidateRow(physicalRow);
              }
            })
          }
        />
      )}
    </>
  );

  return { openDisambiguationDialog, disambiguationDialogs };
}
