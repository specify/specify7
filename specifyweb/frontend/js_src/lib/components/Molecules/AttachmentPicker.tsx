import { LazyAsync } from '../ReactLazy';

/**
 * Attachment Picker loads ResourceView, which in turn loads a ton of
 * things. Replace with async import to split the bundle
 */
export const AttachmentPicker = LazyAsync(async () =>
  import('./SyncAttachmentPicker').then(
    ({ SyncAttachmentPicker }) => SyncAttachmentPicker
  )
);
