import { contextUnlockedPromise } from '../InitialContext';
import {
  createDataResource,
  fetchResourceId,
} from '../Preferences/BasePreferences';

const attachmentDatasetName = 'Bulk Attachment Imports';
export const fetchAttachmentResourceId: Promise<number | undefined> =
  new Promise(async (resolve) => {
    const entryPoint = await contextUnlockedPromise;
    if (entryPoint === 'main') {
      const resourceId = await fetchResourceId(
        '/context/user_resource/',
        attachmentDatasetName
      ).then((resourceId) =>
        resourceId === undefined
          ? createDataResource(
              '/context/user_resource/',
              attachmentDatasetName,
              '[]'
            ).then(({ id }) => id)
          : Promise.resolve(resourceId)
      );
      resolve(resourceId);
    }
  });
