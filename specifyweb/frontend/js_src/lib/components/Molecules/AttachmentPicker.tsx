import { ReactLazy } from '../Router/ReactLazy';

/**
 * Attachment Picker loads ResourceView, which in turn loads a ton of
 * things. Replace with async import to split the bundle
 */
export const AttachmentPicker = ReactLazy(async () =>
  import('./SyncAttachmentPicker').then(
    ({ SyncAttachmentPicker }) => SyncAttachmentPicker
  )
);
