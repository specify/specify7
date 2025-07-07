import { ping } from '../../utils/ajax/ping';
import { GenericNotification } from './NotificationRenderers';
import { formData } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';

export function deleteNotification(
  notification: GenericNotification
): Promise<void> {
  return ping('/notifications/delete/', {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    body: formData({ message_id: notification.messageId }),
    errorMode: 'dismissible',
  }).then(f.void);
}
