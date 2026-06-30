/**
 * Show upload plan as JSON
 */

import React from 'react';

import { json } from '@codemirror/lang-json';
import type { Diagnostic } from '@codemirror/lint';
import { lintGutter } from '@codemirror/lint';
import { search } from '@codemirror/search';
import { EditorView } from 'codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import CodeMirror from '@uiw/react-codemirror';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { jsonLinter } from '../AppResources/codeMirrorLinters';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { downloadFile, fileToText } from '../Molecules/FilePicker';
import { useDarkMode } from '../Preferences/Hooks';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import type { Dataset } from '../WbPlanView/Wrapped';
import { dialogIcons, icons } from '../Atoms/Icons';

/**
 * Button + dialog that opens a CodeMirror-powered JSON editor for
 * viewing and editing a workbench dataset's upload plan.
 */
export function WbRawPlan({
  dataset,
  onDatasetDeleted: handleDatasetDeleted,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly onDatasetDeleted: () => void;
  readonly triggerDatasetRefresh: () => void;
}): JSX.Element {
  const [showRawPlan, openRawPlan, closeRawPlan] = useBooleanState();
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={showRawPlan}
        onClick={openRawPlan}
      >
        {wbPlanText.importExportMapping()}
      </Button.Small>
      {showRawPlan && (
        <RawUploadPlan
          datasetId={dataset.id}
          datasetName={dataset.name}
          isUploaded={
            dataset.uploadresult !== null && dataset.uploadresult.success
          }
          uploadPlan={dataset.uploadplan ?? ({} as UploadPlan)}
          onChanged={(plan) => {
            overwriteReadOnly(dataset, 'uploadplan', plan);
            triggerDatasetRefresh();
          }}
          onClose={closeRawPlan}
          onDeleted={handleDatasetDeleted}
        />
      )}
    </>
  );
}

/**
 * Dialog with a CodeMirror JSON editor for the raw upload plan.
 *
 * Provides import/export via file picker, real-time JSON validation
 * through CodeMirror's lint gutter, and a save button that PUTs the
 * plan back to the API. The save button is disabled while lint errors
 * are present, preventing invalid JSON from being submitted.
 */
function RawUploadPlan({
  datasetId,
  datasetName: name,
  uploadPlan: rawPlan,
  isUploaded,
  onClose: handleClose,
  onChanged: handleChanged,
  onDeleted: handleDeleted,
}: {
  readonly datasetId: number;
  readonly datasetName: string;
  readonly uploadPlan: UploadPlan;
  readonly isUploaded: boolean;
  readonly onClose: () => void;
  readonly onChanged: (plan: UploadPlan) => void;
  readonly onDeleted: () => void;
}): JSX.Element {
  // Current editor text as a string — initialized from the JSON-serialized plan
  const [uploadPlan, setUploadPlane] = React.useState<string>(() =>
    JSON.stringify(rawPlan, null, 4)
  );

  // Shown when a file import fails JSON.parse() or when Save encounters
  // invalid JSON that bypassed lint detection
  const [invalidJson, showInvalid, closeInvalid] = useBooleanState();

  // Errors disable the Save button to prevent submitting invalid JSON.
  const [lintErrors, setLintErrors] = React.useState<RA<Diagnostic>>([]);

  const loading = React.useContext(LoadingContext);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isDarkMode = useDarkMode();

  function handleFileSelected(
    event: React.ChangeEvent<HTMLInputElement>
  ): void {
    const file = event.target.files?.[0];
    if (file === undefined) return;
    loading(
      fileToText(file)
        .then((text) => {
          JSON.parse(text);
          setUploadPlane(text);
        })
        .catch(showInvalid)
    );
    event.target.value = '';
  }

  return (
    <>
      {invalidJson && (
        <Dialog
          icon={dialogIcons.warning}
          buttons={commonText.close()}
          header={wbPlanText.invalidJsonFile()}
          onClose={closeInvalid}
        >
          {wbPlanText.invalidJsonFileDescription()}
        </Dialog>
      )}
      <Dialog
        className={{ container: dialogClassNames.extraWideContainer }}
        icon={icons.clipboard}
        buttons={
          <>
            <input
              accept=".json"
              className="sr-only"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
            />
            <Button.Info
              onClick={(): void => fileInputRef.current?.click()}
            >
              {commonText.import()}
            </Button.Info>
            <Button.Info
              onClick={(): void => void downloadFile(`${name}.json`, uploadPlan)}
            >
              {commonText.export()}
            </Button.Info>
            <span className="-ml-4 flex-1" />
            <Button.DialogClose>{commonText.close()}</Button.DialogClose>
            <Button.Save
              disabled={
                JSON.stringify(rawPlan, null, 4) === uploadPlan ||
                isUploaded ||
                (uploadPlan.trim().length > 0 && lintErrors.length > 0)
              }
              onClick={(): void => {
                let plan: UploadPlan | null;
                try {
                  plan =
                    uploadPlan.length === 0
                      ? null
                      : (JSON.parse(uploadPlan) as UploadPlan);
                } catch {
                  showInvalid();
                  return;
                }
                loading(
                  ping(`/api/workbench/dataset/${datasetId}/`, {
                    method: 'PUT',
                    body: { uploadplan: plan },
                    expectedErrors: [Http.NOT_FOUND],
                  })
                    .then((status) =>
                      status === Http.NOT_FOUND
                        ? handleDeleted()
                        : handleChanged(plan!)
                    )
                    .finally(handleClose)
                );
              }}
            >
              {commonText.save()}
            </Button.Save>
          </>
        }
        header={wbPlanText.importExportMapping()}
        onClose={handleClose}
      >
        <p className="text-wrap mb-4">
          {wbPlanText.importExportMappingDescription()}
        </p>
        <CodeMirror
          value={uploadPlan}
          height="300px"
          extensions={[
            json(),
            lintGutter(),
            jsonLinter(setLintErrors),
            EditorView.lineWrapping,
            search(),
          ]}
          theme={isDarkMode ? okaidia : xcodeLight}
          className="border-brand-300 w-full overflow-y-auto overflow-x-hidden border dark:border-none"
          onChange={(value): void => setUploadPlane(value)}
        />
      </Dialog>
    </>
  );
}
