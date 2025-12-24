import React from 'react';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
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
import type {
  AnySchema,
  AnyTree,
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

type TaxonFileDefaultDefinition = {
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
type TaxonFileDefaultList = RA<TaxonFileDefaultDefinition>;
type TreeCreationInfo = {
  readonly message: string;
  readonly task_id?: string;
}
type TreeCreationProgressInfo = {
  readonly taskstatus: string;
  readonly taskprogress: any;
  readonly taskid: string;
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

  const [isActive, setIsActive] = React.useState(0);
  const [isTreeCreationStarted, setIsTreeCreationStarted] = React.useState(false);
  const [treeCreationTaskId, setTreeCreationTaskId] = React.useState<string | undefined>(undefined);
  const [treeCreationProgress, setTreeCreationProgress] = React.useState<number | undefined>(undefined);
  const [treeCreationProgressTotal, setTreeCreationProgressTotal] = React.useState<number>(1);

  const [selectedResource, setSelectedResource] = React.useState<
    SpecifyResource<AnySchema> | undefined
  >(undefined);

  const [treeOptions, setTreeOptions] = React.useState<
    TaxonFileDefaultList | undefined
  >(undefined);

  // Fetch list of available default trees.
  React.useEffect(() => {
    fetch('https://files.specifysoftware.org/taxonfiles/taxonfiles.json')
      .then(async (response) => response.json())
      .then((data: TaxonFileDefaultList) => {
        setTreeOptions(data);
      })
      .catch((error) => {
        console.error('Failed to fetch tree options:', error);
      });
  }, []);

  const connectedCollection = getSystemInfo().collection;

  // Start default tree creation
  const handleClick = async (resourceUrl: string, mappingUrl: string, disciplineName: string, rowCount: number, treeName: string): Promise<void> => {
    setIsTreeCreationStarted(true);
    setTreeCreationProgress(undefined);
    return ajax<TreeCreationInfo>('/trees/create_default_tree/', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: {
        url: resourceUrl,
        mappingUrl,
        collection: connectedCollection,
        disciplineName,
        rowCount,
        treeName,
      },
    })
      .then(({ data, status }) => {
        if (status === Http.OK) {
          console.log(`${disciplineName} tree created successfully:`, data);
        } else if (status === Http.ACCEPTED) {
          // Tree is being created in the background.
          console.log(`${disciplineName} tree creation started successfully:`, data);
          setTreeCreationTaskId(data.task_id);
        }
      })
      .catch((error) => {
        console.error(`Request failed for ${resourceUrl}:`, error);
        throw error;
      });
  }

  const handleStop = async (): Promise<void> => ping(
      `/trees/create_default_tree/abort/${treeCreationTaskId}/`,
      {
        method: 'POST',
        body: {},
      }
    )
      .then((status) => {
        if (status === Http.NO_CONTENT) {
          setIsTreeCreationStarted(false);
          setTreeCreationTaskId(undefined);
          setTreeCreationProgress(undefined);
        }
      });

  // Poll for tree creation progress
  React.useEffect(() => {
    if (treeCreationTaskId === undefined) return;

    const interval = setInterval(
      async () =>
        ajax<TreeCreationProgressInfo>(`/trees/create_default_tree/status/${treeCreationTaskId}/`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          errorMode: 'silent',
        })
          .then(({ data }) => {
            if (data.taskstatus === 'RUNNING') {
              setTreeCreationProgress(data.taskprogress.current ?? 0);
              setTreeCreationProgressTotal(data.taskprogress.total ?? 1);
            } else if (data.taskstatus === 'FAILURE') {
              setIsTreeCreationStarted(false);
              setTreeCreationTaskId(undefined);
              setTreeCreationProgress(undefined);
              throw data.taskprogress;
            } else if (data.taskstatus === 'SUCCESS') {
              globalThis.location.reload();
            }
          }),
      5000
    );
    return () => clearInterval(interval);
  }, [treeCreationTaskId]);

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
          <Ul className="flex flex-col gap-2">
            <H2>{treeText.populatedTrees()}</H2>
            {treeOptions === undefined
              ? undefined
              : treeOptions.map((resource, index) => (
                  <li key={index}>
                    <Button.LikeLink
                      onClick={(): void => {
                        handleClick(resource.file, resource.mappingFile, resource.discipline, resource.rows, resource.title).catch(console.error);
                      }}
                    >
                      {localized(resource.title)}
                    </Button.LikeLink>
                    <div className="text-xs text-gray-500">
                      {resource.description}
                    </div>
                    <div className="text-xs text-gray-400 italic">
                      {`Source: ${resource.src}`}
                    </div>
                  </li>
                ))}
            <H2>{treeText.emptyTrees()}</H2>
            {defaultTreeDefs.map((resource, index) => (
              <li key={index}>
                <Button.LikeLink
                  onClick={(): void => handleClickEmptyTree(resource)}
                >
                  {localized(resource.name)}
                </Button.LikeLink>
              </li>
            ))}
          </Ul>
          <>
            {isTreeCreationStarted ? (
              <Dialog
                buttons={
                  <>
                    <Button.Danger onClick={handleStop}>
                      {commonText.cancel()}
                    </Button.Danger>
                    <Button.DialogClose component={Button.BorderedGray}>
                      {commonText.close()}
                    </Button.DialogClose>
                  </>
                }
                header={treeText.defaultTreeTaskStarting()}
                onClose={() => {setIsTreeCreationStarted(false); setIsActive(0)}}
              >
                <>
                  {treeCreationProgress === undefined
                    ? null
                    : treeText.defaultTreeCreationProgress({
                        current: treeCreationProgress,
                        total: treeCreationProgressTotal,
                      }
                    )
                  }
                  <Progress
                    max={treeCreationProgressTotal}
                    value={treeCreationProgress ?? 0}
                  />
                </>
                
                {treeText.defaultTreeTaskStartingDescription()}
              </Dialog>
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
