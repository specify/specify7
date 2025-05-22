import React from 'react';

import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { interactionsText } from '../../localization/interactions';
import type { RA, RR } from '../../utils/types';
import { H2, H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { dialogIcons } from '../Atoms/Icons';
import type { AnyTree } from '../DataModel/helperTypes';
import { strictGetTable } from '../DataModel/tables';
import { getTreeDefinitions } from '../InitialContext/treeRanks';
import { Dialog } from '../Molecules/Dialog';
import { TableIcon } from '../Molecules/TableIcon';

export type TreeDefinitionName = string;

export type MissingRanks = {
  // Query can contain relationship to multiple trees
  readonly [KEY in AnyTree['tableName']]: RR<TreeDefinitionName, RA<string>>;
};

export function MissingRanksDialog({
  missingRanks,
  onSelectTreeDef,
  onContinue: handleContinue,
  onClose: handleClose,
}: {
  readonly missingRanks: MissingRanks;
  readonly onSelectTreeDef: (
    treeTableName: AnyTree['tableName'],
    treeDefId: number
  ) => void;
  readonly onContinue: () => void;
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          <Button.Info onClick={handleContinue}>
            {interactionsText.continue()}
          </Button.Info>
        </>
      }
      header={batchEditText.missingRanksInQuery()}
      icon={dialogIcons.info}
      onClose={handleClose}
    >
      <ShowMissingRanks
        missingRanks={missingRanks}
        onSelectTreeDef={onSelectTreeDef}
      />
    </Dialog>
  );
}

function ShowMissingRanks({
  missingRanks,
  onSelectTreeDef: handleSelectTreeDef,
}: {
  readonly missingRanks: MissingRanks;
  readonly onSelectTreeDef: (
    treeTableName: AnyTree['tableName'],
    treeDefId: number
  ) => void;
}) {
  return (
    <div>
      <div className="mt-2 flex gap-2">
        <H2>{batchEditText.addTreeRank()}</H2>
      </div>
      {Object.entries(missingRanks).map(([treeTable, ranks]) => {
        const hasMultipleTreeDefs = Object.values(ranks).length > 1;
        const treeDefinitions = getTreeDefinitions(treeTable, 'all');

        return (
          <div key={treeTable}>
            <div className="flex gap-2">
              <TableIcon
                label={strictGetTable(treeTable).label}
                name={treeTable}
              />
              <H2>{strictGetTable(treeTable).label}</H2>
            </div>
            {hasMultipleTreeDefs && (
              <span>{batchEditText.pickTreesToFilter()}</span>
            )}
            <div>
              {Object.entries(ranks).map(([treeDefName, rankNames]) => {
                const treeDefId = treeDefinitions.find(
                  ({ definition }) => definition.name === treeDefName
                )?.definition.id;
                return (
                  <div key={treeDefName}>
                    <Label.Inline>
                      {hasMultipleTreeDefs && treeDefId !== undefined ? (
                        <Input.Checkbox
                          onChange={() =>
                            handleSelectTreeDef(treeTable, treeDefId)
                          }
                        />
                      ) : undefined}
                      <H3>{`${treeDefName}:`}</H3>
                    </Label.Inline>
                    <Ul>
                      {rankNames.map((rank) => (
                        <li className="px-8" key={rank}>
                          {rank}
                        </li>
                      ))}
                    </Ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
