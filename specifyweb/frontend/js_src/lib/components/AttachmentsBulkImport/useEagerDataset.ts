import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import { removeKey } from '../../utils/utils';
import { fetchAttachmentResourceId } from './fetchAttachmentResource';
import type { EagerDataSet } from './Import';
import { generateUploadSpec } from './SelectUploadPath';
import type {
  AttachmentDataSetResource,
  BoundFile,
  SavedAttachmentDataSetResource,
  UnBoundFile,
} from './types';

let syncingResourcePromise:
  | Promise<SavedAttachmentDataSetResource | undefined>
  | undefined = undefined;

const cleanFileBeforeSync = (
  file: UnBoundFile
): Omit<BoundFile, 'lastModified' | 'webkitRelativePath'> => ({
  size: file.size,
  name: file.name,
  parsedName: file.parsedName,
  type: file.type,
});

export async function resolveAttachmentDataSetSync(
  rawResourceToSync: EagerDataSet
) {
  const resourceId = await fetchAttachmentResourceId;
  if (resourceId === undefined) return undefined;
  const resourceToSync = removeKey(
    {
      ...rawResourceToSync,
      uploadableFiles: rawResourceToSync.uploadableFiles.map((uploadable) => ({
        ...uploadable,
        file: f.maybe(uploadable.file, cleanFileBeforeSync),
      })),
    },
    'needsSaved',
    'save'
  ) as AttachmentDataSetResource | SavedAttachmentDataSetResource;
  if ('id' in resourceToSync) {
    // If not creating new "resource", it is fine to PUT while not resolved.
    return ajax<SavedAttachmentDataSetResource>(
      `/attachment_gw/dataset/${resourceId}/${resourceToSync.id}/`,
      {
        headers: { Accept: 'application/json' },
        method: 'PUT',
        body: JSON.stringify(resourceToSync),
      }
    ).then(({ data }) => data);
  }
  // New resource created.

  syncingResourcePromise ??= ajax<SavedAttachmentDataSetResource>(
    `/attachment_gw/dataset/${resourceId}/`,
    {
      headers: { Accept: 'application/json' },
      method: 'POST',
      body: JSON.stringify(resourceToSync),
    }
  )
    .then(({ data }) => data)
    .finally(() => (syncingResourcePromise = undefined));

  return syncingResourcePromise;
}

export function useEagerDataSet<
  DATASET extends AttachmentDataSetResource | SavedAttachmentDataSetResource
>(
  baseDataSet: DATASET
): readonly [
  eagerDataSet: EagerDataSet,
  isSaving: boolean,
  isBrandNew: boolean,
  triggerSave: () => void,
  commitChange: (
    stateGenerator: (oldState: EagerDataSet) => EagerDataSet
  ) => void
] {
  const isBrandNew = !('id' in baseDataSet);
  const isReconstructed =
    baseDataSet.status !== undefined && baseDataSet.status !== null;
  const [eagerDataSet, setEagerDataSet] = React.useState<EagerDataSet>({
    ...baseDataSet,
    status:
      baseDataSet.status === 'uploading'
        ? 'uploadInterrupted'
        : baseDataSet.status === 'deleting'
        ? 'deletingInterrupted'
        : isBrandNew
        ? 'renaming'
        : 'main',
    needsSaved: isReconstructed,
    uploadableFiles: baseDataSet.uploadableFiles ?? [],
    save: false,
    uploadSpec: generateUploadSpec(baseDataSet.uploadSpec.staticPathKey),
  });

  const handleSaved = () => {
    setEagerDataSet((oldEagerState) => ({
      ...oldEagerState,
      needsSaved: false,
      save: false,
    }));
  };

  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const handleSyncedAndSaved = () => {
    setIsSaving(false);
    handleSaved();
  };
  React.useEffect(() => {
    let destructorCalled = false;
    if (eagerDataSet.needsSaved && eagerDataSet.save) {
      setIsSaving(true);
      resolveAttachmentDataSetSync(eagerDataSet).then((savedResource) => {
        if (destructorCalled || savedResource === undefined) return;
        if (isBrandNew) {
          navigate(`/specify/attachments/import/${savedResource.id}`);
        } else {
          handleSyncedAndSaved();
        }
      });
    }
    return () => {
      destructorCalled = true;
    };
  }, [eagerDataSet]);

  return [
    eagerDataSet,
    isSaving,
    isBrandNew,
    () =>
      setEagerDataSet((oldEagerState) => ({
        ...oldEagerState,
        save: true,
      })),
    (stateGenerator) =>
      setEagerDataSet((oldState) => ({
        ...stateGenerator(oldState),
        needsSaved: true,
        save: oldState.save,
      })),
  ];
}
