import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useUnloadProtect } from '../../hooks/navigation';
import { mainText } from '../../localization/main';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import { removeKey } from '../../utils/utils';
import { LoadingContext } from '../Core/Contexts';
import type { EagerDataSet } from './Import';
import { generateUploadSpec } from './SelectUploadPath';
import type { AttachmentDataSet, BoundFile, UnBoundFile } from './types';

type PostResponse = {
  readonly id: number;
  readonly name: string;
};

let syncingResourcePromise: Promise<PostResponse | undefined> | undefined =
  undefined;

const serializeFile = ({
  file: { size, type, name },
}: UnBoundFile): BoundFile => ({
  size,
  name,
  type,
});

export async function resolveAttachmentDataSetSync(
  rawResourceToSync: EagerDataSet
) {
  const resourceToSync: AttachmentDataSet = removeKey(
    {
      ...rawResourceToSync,
      rows: rawResourceToSync.rows.map((uploadable) => ({
        ...uploadable,
        uploadFile: {
          file: f.maybe(uploadable.uploadFile, serializeFile),
          parsedName: uploadable.uploadFile.parsedName,
        },
      })),
    },
    'needsSaved',
    'save'
  ) as AttachmentDataSet;
  if ('id' in resourceToSync) {
    // If not creating new "resource", it is fine to PUT while not resolved.
    return ping(`/attachment_gw/dataset/${resourceToSync.id}/`, {
      headers: { Accept: 'text/plain' },
      method: 'PUT',
      body: JSON.stringify(resourceToSync),
      expectedErrors: [Http.NO_CONTENT],
    }).then(f.undefined);
  }

  // Creating new resource.
  syncingResourcePromise ??= ajax<PostResponse>(`/attachment_gw/dataset/`, {
    headers: { Accept: 'application/json' },
    method: 'POST',
    body: JSON.stringify(resourceToSync),
    expectedErrors: [Http.CREATED],
  })
    .then(({ data }) => data)
    .finally(() => (syncingResourcePromise = undefined));

  return syncingResourcePromise;
}

export function useEagerDataSet(baseDataSet: AttachmentDataSet): {
  readonly eagerDataSet: EagerDataSet;
  readonly triggerSave: () => void;
  readonly commitChange: (
    stateGenerator: (oldState: EagerDataSet) => EagerDataSet,
    silent?: boolean
  ) => void;
  readonly unsetUnloadProtect: () => void;
} {
  const [eagerDataSet, setEagerDataSet] = React.useState<EagerDataSet>({
    ...baseDataSet,
    uploaderstatus:
      baseDataSet.uploaderstatus === 'uploading'
        ? 'uploadInterrupted'
        : baseDataSet.uploaderstatus === 'deleting'
          ? 'deletingInterrupted'
          : 'main',
    needsSaved: baseDataSet.uploaderstatus !== 'main',
    rows: baseDataSet.rows ?? [],
    save: false,
    uploadplan: generateUploadSpec(baseDataSet.uploadplan.staticPathKey),
    uploadresult:
      baseDataSet.uploadresult === undefined ||
      baseDataSet.uploadresult === null
        ? undefined
        : {
            timestamp: baseDataSet.uploadresult.timestamp,
            // FEATURE: Add reporting partial upload
            success: baseDataSet.rows.some(
              ({ attachmentId }) => typeof attachmentId === 'number'
            ),
          },
  });

  const unsetUnloadProtect = useUnloadProtect(
    // Don't trigger unload protect if upload / rollback was interrupted
    eagerDataSet.needsSaved && baseDataSet.uploaderstatus === 'main',
    mainText.leavePageConfirmationDescription()
  );

  const handleSaved = () =>
    setEagerDataSet((oldEagerState) => ({
      ...oldEagerState,
      needsSaved: false,
      save: false,
    }));

  const navigate = useNavigate();
  const loading = React.useContext(LoadingContext);

  React.useEffect(() => {
    let destructorCalled = false;
    if (eagerDataSet.needsSaved && eagerDataSet.save) {
      loading(
        resolveAttachmentDataSetSync(eagerDataSet).then((savedResource) => {
          if (destructorCalled) return;
          unsetUnloadProtect();
          if (savedResource === undefined) {
            handleSaved();
          } else navigate(`/specify/attachments/import/${savedResource.id}`);
        })
      );
    }
    return () => {
      destructorCalled = true;
    };
  }, [eagerDataSet]);

  return {
    eagerDataSet,
    triggerSave: () =>
      setEagerDataSet((oldEagerState) => ({
        ...oldEagerState,
        save: true,
      })),
    commitChange: (stateGenerator, silent = false) =>
      setEagerDataSet((oldState) => ({
        ...stateGenerator(oldState),
        needsSaved: !silent,
        save: oldState.save,
      })),
    unsetUnloadProtect,
  };
}
