import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { queryText } from '../../localization/query';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import type { DeepPartial, RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { H2, Ul } from '../Atoms';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import type {
  AnySchema,
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { deserializeResource } from '../DataModel/serializers';
import type { TaxonTreeDef } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { getSystemInfo } from '../InitialContext/systemInfo';
import type { TreeInformation } from '../InitialContext/treeRanks';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { defaultTreeDefs } from './defaults';

export type TaxonFileDefaultDefinition = {
  readonly discipline: string;
  readonly title: string;
  readonly coverage: string;
  readonly file: string;
  readonly mappingFile: string;
  readonly src: string;
  readonly size: number;
  readonly rows: number;
  readonly description: string;
};
export type TaxonFileDefaultList = RA<TaxonFileDefaultDefinition>;
type TreeCreationInfo = {
  readonly message: string;
  readonly task_id?: string;
};
type TreeCreationProgressInfo = {
  readonly taskstatus: string;
  readonly taskprogress: any;
  readonly taskid: string;
};

export async function fetchDefaultTrees(): Promise<TaxonFileDefaultList> {
  const response = await fetch(
    'https://files.specifysoftware.org/taxonfiles/taxonfiles.json'
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch default trees: ${response.status} ${response.statusText}`
    );
  }
  const data = await response.json();
  return data as TaxonFileDefaultList;
}

export function CreateTree<
  SCHEMA extends AnyTree,
  TREE_NAME extends AnyTree['tableName'],
>({
  tableName,
  treeDefinitions,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefinitions: TreeInformation[TREE_NAME];
}): JSX.Element {
  const treeNameArray = treeDefinitions.map((tree) => tree.definition.name);

  const loading = React.useContext(LoadingContext);
  const [isActive, setIsActive] = React.useState(0);
  const [isTreeCreationStarted, setIsTreeCreationStarted] =
    React.useState(false);
  const [treeCreationTaskId, setTreeCreationTaskId] = React.useState<
    string | undefined
  >(undefined);

  const [selectedResource, setSelectedResource] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  const connectedCollection = getSystemInfo().collection;

  // Start default tree creation
  const handleClick = async (
    resource: TaxonFileDefaultDefinition
  ): Promise<void> => {
    setIsTreeCreationStarted(true);
    return startTreeCreation(
      resource.file,
      resource.mappingFile,
      connectedCollection,
      resource.discipline,
      resource.rows,
      resource.title,
      undefined,
      undefined,
      (taskId: string | undefined) => setTreeCreationTaskId(taskId)
    );
  };

  const handleClickEmptyTree = (
    resource: DeepPartial<SerializedResource<TaxonTreeDef>>
  ) => {
    const uniqueName = getUniqueName(
      resource.name!,
      treeNameArray,
      Number.POSITIVE_INFINITY,
      'name'
    );
    const dsResource = deserializeResource(resource);
    dsResource.set('name', uniqueName as never);
    setSelectedResource(dsResource);
    setIsActive(2);
  };

  return (
    <>
      {tableName === 'Taxon' && userInformation.isadmin ? (
        <Button.Icon
          className={className.dataEntryAdd}
          icon="plus"
          title={treeText.addTree()}
          onClick={() => {
            setIsActive(1);
          }}
        />
      ) : null}
      {isActive === 1 ? (
        <Dialog
          buttons={
            <Button.DialogClose component={Button.BorderedGray}>
              {commonText.cancel()}
            </Button.DialogClose>
          }
          header={treeText.addTree()}
          onClose={() => setIsActive(0)}
        >
          <div className="flex flex-col gap-5">
            <section>
              <PopulatedTreeList
                handleClick={(resource) => {
                  loading(handleClick(resource).catch(console.error));
                }}
              />
            </section>
            <section>
              <EmptyTreeList handleClick={handleClickEmptyTree} />
            </section>
          </div>
          <>
            {isTreeCreationStarted && treeCreationTaskId ? (
              <TreeCreationProgressDialog
                taskId={treeCreationTaskId}
                onClose={() => {
                  setIsTreeCreationStarted(false);
                  setTreeCreationTaskId(undefined);
                  setIsActive(0);
                }}
                onStopped={() => {
                  setIsTreeCreationStarted(false);
                  setTreeCreationTaskId(undefined);
                }}
              />
            ) : undefined}
          </>
        </Dialog>
      ) : null}
      {isActive === 2 && selectedResource !== undefined ? (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={selectedResource}
          onAdd={undefined}
          onClose={() => setIsActive(0)}
          onDeleted={undefined}
          onSaved={(): void => globalThis.location.reload()}
        />
      ) : null}
    </>
  );
}

export function ImportTree<SCHEMA extends AnyTree>({
  tableName,
  treeDefId,
  treeDefinitionItems,
  buttonLabel,
  buttonClassName,
}: {
  readonly tableName: SCHEMA['tableName'];
  readonly treeDefId: number;
  readonly treeDefinitionItems: RA<
      SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>
    >;
  readonly buttonLabel?: LocalizedString;
  readonly buttonClassName?: string;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  const [isActive, setIsActive] = React.useState(0);
  const [isTreeCreationStarted, setIsTreeCreationStarted] =
    React.useState(false);
  const [treeCreationTaskId, setTreeCreationTaskId] = React.useState<
    string | undefined
  >(undefined);

  const [missingTreeRanks, setMissingTreeRanks] = React.useState<RA<string> | undefined>(undefined);
  const [isMissingTreeRanks, setIsMissingTreeRanks] = React.useState<boolean>(false);
  const [selectedPopulatedTree, setSelectedPopulatedTree] = React.useState<TaxonFileDefaultDefinition | undefined>(undefined);

  const connectedCollection = getSystemInfo().collection;

  const handleClick = async (
    resource: TaxonFileDefaultDefinition,
    createMissingRanks?: boolean
  ): Promise<void> => {
    setSelectedPopulatedTree(resource);
    // Check for missing ranks if no preference for createMissingRanks was provided.
    if (createMissingRanks === undefined) {
      try {
        const response = await ajax<any>(`/trees/default_tree_mapping/`, {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: {
            mappingUrl: resource.mappingFile
          }
        });
        if (response.status === Http.OK && response.data) {
          const mappingRankNames = response.data.ranks.map((rank: any) => {return rank.name});
          const existingNames = treeDefinitionItems.map((item) => item.name);

          const missing = mappingRankNames
            .filter((rankName: string) => !existingNames.includes(rankName));

          if (missing.length > 0) {
            setSelectedPopulatedTree(resource);
            setMissingTreeRanks(missing);
            setIsMissingTreeRanks(true);
            return;
          }
          // If all ranks are present then continue as normal
        } else {
          console.warn(`Failed to fetch mapping for ${resource.mappingFile}`);
        }
      } catch (err) {
        console.warn('Error fetching or parsing mapping file', err);
      }
    }

    setIsTreeCreationStarted(true);
    return startTreeCreation(
      resource.file,
      resource.mappingFile,
      connectedCollection,
      resource.discipline,
      resource.rows,
      resource.title,
      treeDefId,
      createMissingRanks,
      (taskId: string | undefined) => setTreeCreationTaskId(taskId)
    );
  };

  return (
    <>
      {tableName === 'Taxon' && userInformation.isadmin ? (
        buttonLabel ? (
          <Button.LikeLink
            className={`flex items-center gap-2 ${buttonClassName ?? ''}`}
            title={buttonLabel}
            aria-label={buttonLabel}
            onClick={() => {
              setIsActive(1);
            }}
          >
            {icons.upload}
            <span>{buttonLabel}</span>
          </Button.LikeLink>
        ) : (
          <Button.Icon
            icon="upload"
            title={commonText.import()}
            onClick={() => {
              setIsActive(1);
            }}
          />
        )
      ) : null}
      {isMissingTreeRanks && missingTreeRanks && selectedPopulatedTree ? (
        <MissingTreeRanksDialog
          handleNo={() => {
            setIsMissingTreeRanks(false);
            handleClick(selectedPopulatedTree, false);
          }}
          handleYes={() => {
            setIsMissingTreeRanks(false);
            handleClick(selectedPopulatedTree, true);
          }}
          onClose={() => {
            setIsMissingTreeRanks(false);
          }}
          missingTreeRanks={missingTreeRanks}
        />
      ) : null}
      {isActive === 1 ? (
        <Dialog
          buttons={
            <Button.DialogClose>
              {commonText.cancel()}
            </Button.DialogClose>
          }
          header={commonText.import()}
          onClose={() => setIsActive(0)}
        >
          <div className="flex flex-col gap-5">
            <PopulatedTreeList
              handleClick={(resource) => {
                loading(handleClick(resource).catch(console.error));
              }}
            />
          </div>
          <>
            {isTreeCreationStarted && treeCreationTaskId ? (
              <TreeCreationProgressDialog
                taskId={treeCreationTaskId}
                onClose={() => {
                  setIsTreeCreationStarted(false);
                  setTreeCreationTaskId(undefined);
                  setIsActive(0);
                }}
                onStopped={() => {
                  setIsTreeCreationStarted(false);
                  setTreeCreationTaskId(undefined);
                }}
              />
            ) : undefined}
          </>
        </Dialog>
      ) : null}
    </>
  );
}

async function startTreeCreation(
  url: string,
  mappingUrl: string,
  collection: string,
  disciplineName: string,
  rowCount: number,
  treeName: string,
  treeDefId: number | undefined,
  createMissingRanks: boolean | undefined,
  onSuccess: (taskId: string | undefined) => void,
): Promise<void> {
  return ajax<TreeCreationInfo>('/trees/create_default_tree/', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: {
      url,
      mappingUrl,
      collection,
      disciplineName,
      rowCount,
      treeName,
      treeDefId,
      createMissingRanks,
    },
  })
    .then(({ data, status }) => {
      if (status === Http.OK) {
        console.log(`${treeName} tree created successfully:`, data);
      } else if (status === Http.ACCEPTED) {
        // Tree is being created in the background.
        console.log(
          `${treeName} tree creation started successfully:`,
          data
        );
        onSuccess(data.task_id);
      }
    })
    .catch((error) => {
      console.error(`Request failed for ${treeName}:`, error);
      throw error;
    });
}

function EmptyTreeList({
  handleClick,
}: {
  readonly handleClick: (
    resource: DeepPartial<SerializedResource<TaxonTreeDef>>
  ) => void;
}): JSX.Element {
  return (
    <Ul className="flex flex-col gap-2">
      <H2>{treeText.emptyTrees()}</H2>
      {defaultTreeDefs.map((resource, index) => (
        <li key={index}>
          <Button.LikeLink onClick={(): void => handleClick(resource)}>
            {localized(resource.name)}
          </Button.LikeLink>
        </li>
      ))}
    </Ul>
  );
}

export function PopulatedTreeList({
  handleClick,
  discipline,
}: {
  readonly handleClick: (resource: TaxonFileDefaultDefinition) => void;
  readonly discipline?: string;
}): JSX.Element {
  const [treeOptions, setTreeOptions] = React.useState<
    TaxonFileDefaultList | undefined
  >(undefined);

  // Fetch list of available default trees.
  React.useEffect(() => {
    fetchDefaultTrees()
      .then((data) => setTreeOptions(data))
      .catch((error) => {
        console.error('Failed to fetch tree options:', error);
      });
  }, []);

  // If a discipline name was provided only show trees belonging to that discipline.
  const displayedOptions =
    treeOptions === undefined
      ? undefined
      : discipline
        ? treeOptions.filter((r) => r.discipline === discipline)
        : treeOptions;

  return (
    <Ul className="flex flex-col gap-2">
      <H2>{treeText.populatedTrees()}</H2>
      {displayedOptions === undefined
        ? undefined
        : displayedOptions.map((resource, index) => (
            <li key={index}>
              <Button.LikeLink onClick={(): void => handleClick(resource)}>
                {localized(resource.title)}
              </Button.LikeLink>
              <div className="text-xs text-gray-500">
                {resource.description}
              </div>
              <div className="text-xs text-gray-400 italic">
                {`${treeText.source()}: ${resource.src}`}
              </div>
            </li>
          ))}
    </Ul>
  );
}

export function MissingTreeRanksDialog({
  missingTreeRanks,
  handleYes,
  handleNo,
  onClose,
}: {
  readonly missingTreeRanks: RA<string>;
  readonly handleYes: () => void;
  readonly handleNo: () => void;
  readonly onClose: () => void;
}): JSX.Element | null {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>
            {commonText.close()}
          </Button.DialogClose>
          <Button.Secondary onClick={handleNo}>
            {commonText.no()}
          </Button.Secondary>
          <Button.Info onClick={handleYes}>
            {queryText.yes()}
          </Button.Info>
        </>
      }
      header={treeText.missingRanks()}
      onClose={onClose}
    >
      <div className="mb-4 flex flex-col gap-4">
        <section>
          {treeText.missingRanksDescription()}
        </section>
        <section>
          <ul className="ml-4">
            {missingTreeRanks && missingTreeRanks.length > 0
              ? missingTreeRanks.map((rank) => <li key={rank}>{rank}</li>)
              : null}
          </ul>
        </section>
        <section>
          {treeText.createMissingRanks()}
        </section>
      </div>
    </Dialog>
  );
}

export function TreeCreationProgressDialog({
  taskId,
  onClose,
  onStopped,
}: {
  readonly taskId: string;
  readonly onClose: () => void;
  readonly onStopped: () => void;
}): JSX.Element | null {
  const loading = React.useContext(LoadingContext);
  const [progress, setProgress] = React.useState<number | undefined>(undefined);
  const [progressTotal, setProgressTotal] = React.useState<number>(1);

  const handleStop = async (): Promise<void> => {
    ping(`/trees/create_default_tree/abort/${taskId}/`, {
      method: 'POST',
      body: {},
    }).then((status) => {
      if (status === Http.NO_CONTENT) {
        onStopped();
      }
    });
  };

  // Poll for tree creation progress
  React.useEffect(() => {
    const interval = setInterval(
      async () =>
        ajax<TreeCreationProgressInfo>(
          `/trees/create_default_tree/status/${taskId}/`,
          {
            method: 'GET',
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
          }
        ).then(({ data }) => {
          if (data.taskstatus === 'RUNNING') {
            setProgress(data.taskprogress.current ?? 0);
            setProgressTotal(data.taskprogress.total ?? 1);
          } else if (data.taskstatus === 'FAILURE') {
            onStopped();
            throw data.taskprogress;
          } else if (data.taskstatus === 'SUCCESS') {
            globalThis.location.reload();
          }
        }),
      5000
    );
    return () => clearInterval(interval);
  }, [taskId]);

  return (
    <Dialog
      buttons={
        <>
          <Button.Danger
            onClick={() => {
              loading(handleStop());
            }}
          >
            {commonText.cancel()}
          </Button.Danger>
          <Button.DialogClose component={Button.BorderedGray}>
            {commonText.close()}
          </Button.DialogClose>
        </>
      }
      header={treeText.defaultTreeCreationStarted()}
      onClose={onClose}
    >
      <>
        {progress === undefined
          ? null
          : treeText.defaultTreeCreationProgress({
              current: progress,
              total: progressTotal,
            })}
        <Progress max={progressTotal} value={progress ?? 0} />
      </>
      {treeText.defaultTreeCreationStartedDescription()}
    </Dialog>
  );
}
