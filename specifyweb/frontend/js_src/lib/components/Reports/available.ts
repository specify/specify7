import { ajax } from '../../utils/ajax';
import { cachableUrl, contextUnlockedPromise } from '../InitialContext';

export const reportsAvailable = contextUnlockedPromise.then(
  async (entrypoint) =>
    entrypoint === 'main'
      ? ajax<{ readonly available: boolean }>(
          cachableUrl('/context/report_runner_status.json'),
          {
            headers: { Accept: 'application/json' },
          }
        )
          .then(({ data }) => data.available)
          .catch(() => false)
      : false
);
