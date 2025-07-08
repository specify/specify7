import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { GenericNotification } from './NotificationRenderers';

export async function deleteNotification(
  notification: GenericNotification
): Promise<void> {
  return ping('/notifications/delete/', {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    body: formData({ message_id: notification.messageId }),
    errorMode: 'dismissible',
  }).then(f.void);
}
