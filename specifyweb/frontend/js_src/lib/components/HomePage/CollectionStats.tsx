import React from 'react';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { Dialog } from '../Molecules/Dialog';

type CollectionStatsRow = {
  readonly name: string;
  readonly specimenCount: number;
  readonly collectionType: string;
};

export function CollectionStats(): JSX.Element {
  const [showCollStatsDialog, setShowCollStatsDialog] = React.useState(false);
  const [tableData, setTableData] = React.useState<string | ReadonlyArray<CollectionStatsRow>>(commonText.failedCollectionStats());
  const [isLoadingStats, setIsLoadingStats] = React.useState(false);
  const errorMsg: string = commonText.failedCollectionStats();

  return (
    <div className="flex justify-end gap-2 pr-4 pt-4">
      <Button.Secondary
        onClick={(): void => {
          setIsLoadingStats(true);
          setShowCollStatsDialog(true);
          void ajax<ReadonlyArray<CollectionStatsRow>>(
            '/stats/collection/statistics/',
            {
              headers: {
                Accept: 'application/json',
              },
            }
          )
            .then(({ data }) => {
              setTableData(Array.isArray(data) ? data : errorMsg);
            })
            .catch(() => {
            setTableData(errorMsg);
            })
            .finally(() => {
              setIsLoadingStats(false);
            });
        }}
      >
        {commonText.collStats()}
      </Button.Secondary>

      {showCollStatsDialog && (
        <Dialog
          buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
          header={commonText.collStats()}
          onClose={(): void => setShowCollStatsDialog(false)}
        >
          {isLoadingStats ? (
            <p>{commonText.loading()}</p>
          ) : (!Array.isArray(tableData) ? (
            <p>{commonText.failedCollectionStats()}</p>
          ) :
          (tableData.length > 0 ? (
            <CollectionStatsTable rows={tableData} />
          ) : (
            <p>{commonText.noCollectionStats()}</p>
          )))}
        </Dialog>
      )}
    </div>
  );
}

function CollectionStatsTable({
  rows,
}: {
  readonly rows: ReadonlyArray<CollectionStatsRow>;
}): JSX.Element {
  return (
    <div className="max-h-[420px] overflow-auto rounded border border-gray-400">
      <table className="w-full border-collapse table-fixed text-left">
        <thead>
          <tr className="bg-gray-300">
            <th className="border border-gray-400 px-3 py-1 text-xl font-bold text-black">
              {commonText.collName()}
            </th>
            <th className="border border-gray-400 px-3 py-1 text-xl font-bold text-black">
              {commonText.numberOfSpecimens()}
            </th>
            <th className="border border-gray-400 px-3 py-1 text-xl font-bold text-black">
              {commonText.collectionType()}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="odd:bg-gray-100 even:bg-gray-200" key={row.name}>
              <td className="border border-gray-300 px-3 py-1 text-2xl text-black">
                {row.name}
              </td>
              <td className="border border-gray-300 px-3 py-1 text-2xl text-black">
                {row.specimenCount.toLocaleString()}
              </td>
              <td className="border border-gray-300 px-3 py-1 text-2xl text-black">
                {row.collectionType}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}