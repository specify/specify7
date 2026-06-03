/**
 * Task Manager — Displays all active Celery tasks across all workers
 * and allows administrators to stop individual tasks.
 *
 * ## Problem this solves
 * Before this component, users could initiate WorkBench actions
 * (upload, validate, rollback) but had no way to see or manage them
 * after navigating away from the dataset page. Refreshing the page
 * or closing the tab would permanently hide the progress dialog.
 *
 * ## Architecture
 * - Backend polls Celery's `inspect` API to find active/reserved tasks
 * - Frontend polls every 5 seconds for live updates
 * - Uses the existing `Dialog` component for the overlay pattern
 * - Stops tasks via the generic `/api/workbench/revoke/<taskid>/` endpoint
 *   which handles both WorkBench (clears uploaderstatus) and non-WB tasks
 */

import React from 'react';

import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import { SECOND } from '../Atoms/timeUnits';
import { Dialog } from '../Molecules/Dialog';
import { hasPermission } from '../Permissions/helpers';
import { userInformation } from '../InitialContext/userInformation';
import { OverlayContext } from '../Router/Router';

/**
 * Mirror of the backend task list response.
 * `id` is the Spdataset ID (0 for non-WB tasks).
 * `queued` distinguishes actively-running from waiting tasks.
 * `taskinfo.status` carries optional human-readable state like "Compressing…".
 */
type TaskInfo = {
  readonly id: number;
  readonly name: string;
  readonly operation: string;
  readonly taskid: string;
  readonly taskstatus: 'PROGRESS' | 'PENDING' | 'FAILURE';
  readonly taskinfo: {
    readonly current?: number;
    readonly total?: number;
    readonly status?: string;
  } | null;
  readonly owner: string;
  readonly isupdate: boolean;
  readonly queued: boolean;
};

/**
 * Maps WorkBench operations to human-readable labels.
 * Non-WB tasks fall through to display the raw operation string.
 */
const operationLabels: Record<string, string> = {
  validating: wbText.validating(),
  uploading: wbText.upload(),
  unuploading: wbText.rollback(),
};

/**
 * Compute percentage complete from Celery progress metadata.
 * Clamped to 100% — during backup compression `current > total`
 * and we show "100%" with a status text like "Compressing…".
 */
const getProgressPercent = (task: TaskInfo): number | undefined => {
  const { current, total } = task.taskinfo ?? {};
  if (current == null || total == null || total === 0) return undefined;
  return Math.min(Math.round((current / total) * 100), 100);
};

export function TaskManagerOverlay(): JSX.Element | null {
  // Close callback provided by the overlay router
  const handleClose = React.useContext(OverlayContext);

  // Only admins or users with the explicit `/task_manager` read permission
  // can access this tool. Returns `null` so the overlay renders nothing.
  if (!userInformation.isadmin && !hasPermission('/task_manager', 'read'))
    return null;

  const [tasks, setTasks] = React.useState<RA<TaskInfo> | undefined>(undefined);
  // Tracks which tasks have been requested to stop (by Celery task ID)
  const [stopping, setStopping] = React.useState<RA<string>>([]);
  // Success/failure message shown at top of dialog
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  // Auto-dismiss the message banner after 5 seconds
  React.useEffect(() => {
    if (message === undefined) return;
    const timer = globalThis.setTimeout(() => setMessage(undefined), 5 * SECOND);
    return (): void => globalThis.clearTimeout(timer);
  }, [message]);

  /**
   * Fetch tasks from the backend and detect which stopped tasks have
   * been removed from the Celery queue.
   *
   * When a task ID disappears from the response, we remove it from
   * `stopping` and show a success message. This ensures "Task stopped"
   * only appears after the worker has actually acknowledged the revoke.
   */
  const fetchTasks = async (): Promise<void> => {
    const { data } = await ajax<RA<TaskInfo>>('/api/workbench/tasks/', {
      headers: { Accept: 'application/json' },
    });
    setTasks(data);
    setStopping((currentStopping) =>
      currentStopping.filter((id) => {
        if (data.some((t) => t.taskid === id)) return true;
        setMessage(headerText.taskStopped());
        return false;
      })
    );
  };

  // Poll every 5 seconds. `active` flag prevents state updates after unmount.
  React.useEffect(() => {
    let active = true;
    const poll = (): void => {
      void fetchTasks().then(() => {
        if (active) globalThis.setTimeout(poll, 5 * SECOND);
      });
    };
    void poll();
    return (): void => {
      active = false;
    };
  }, []);

  /**
   * Stop a task via the generic Celery revoke endpoint.
   *
   * We use `/api/workbench/revoke/<taskid>/` rather than the older
   * `/api/workbench/abort/<ds_id>/` because revoke:
   * 1. Works for ALL Celery tasks (not just WorkBench datasets)
   * 2. Handles WB cleanup internally (AsyncResult.revoke + uploaderstatus)
   * 3. Does not require dataset ownership checks
   */
  const handleStop = async (taskid: string): Promise<void> => {
    setStopping((prev) => [...prev, taskid]);
    try {
      await ajax(`/api/workbench/revoke/${taskid}/`, {
        method: 'POST',
        headers: { Accept: 'text/plain' },
      });
      void fetchTasks();
    } catch {
      setMessage(headerText.taskStopFailed());
      setStopping((prev) => prev.filter((id) => id !== taskid));
    }
  };

  return (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={headerText.taskManager()}
      icon={icons.clock}
      onClose={handleClose}
    >
      {/* Status message: green for success, red for failure */}
      {message && (
        <div
          className={`rounded p-2 text-center ${
            message === headerText.taskStopped()
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message}
        </div>
      )}
      {tasks === undefined ? (
        commonText.loading()
      ) : tasks.length === 0 ? (
        <div className="text-center text-gray-500">
          {headerText.noActiveTasks()}
        </div>
      ) : (
        <table className="w-full table-auto">
          <thead className="text-left">
            <tr>
              <th scope="col">{headerText.taskOperation()}</th>
              <th scope="col">{headerText.taskDataSet()}</th>
              <th scope="col">{headerText.taskOwner()}</th>
              <th scope="col">{headerText.taskProgress()}</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const percent = getProgressPercent(task);
              const isStopping = stopping.includes(task.taskid);
              const statusText = task.taskinfo?.status;
              return (
                <tr
                  key={task.taskid}
                  // Dim queued tasks to visually distinguish them from running ones
                  className={task.queued ? 'opacity-60' : ''}
                >
                  <td className="py-2">
                    {operationLabels[task.operation] ?? task.operation}
                    {task.queued && (
                      <span className="ml-2 text-xs">(queued)</span>
                    )}
                  </td>
                  <td className="py-2">
                    {task.name}
                    {task.isupdate && (
                      <span className="ml-2 text-xs">
                        ({batchEditText.batchEdit()})
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap py-2">{task.owner}</td>
                  <td className="min-w-[250px] py-2 pr-4">
                    {/* Queued tasks show nothing in the progress column */}
                    {task.queued ? (
                      <span />
                    ) : percent !== undefined ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Progress
                            max={100}
                            value={percent}
                            className="flex-1"
                          />
                          <span className="w-12 text-right text-sm">
                            {percent}%
                          </span>
                        </div>
                        {/*
                         * Optional status text (e.g. "Compressing…" during
                         * backup post-processing). Provided by the task via
                         * self.update_state(meta={'status': '...'})
                         */}
                        {statusText && (
                          <span className="text-xs text-gray-500">
                            {statusText}
                          </span>
                        )}
                      </div>
                    ) : task.taskstatus === 'FAILURE' ? (
                      <span className="text-red-500">
                        {headerText.taskStopFailed()}
                      </span>
                    ) : (
                      commonText.loading()
                    )}
                  </td>
                  <td className="py-2">
                    <Button.Danger
                      aria-label={headerText.stopTask()}
                      disabled={isStopping}
                      onClick={(): void => {
                        void handleStop(task.taskid);
                      }}
                    >
                      {isStopping ? commonText.loading() : wbText.stop()}
                    </Button.Danger>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Dialog>
  );
}