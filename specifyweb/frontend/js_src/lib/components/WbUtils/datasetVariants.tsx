import { batchEditText } from '../../localization/batchEdit';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { f } from '../../utils/functools';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';

const baseWbVariant = {
  fetchUrl: '/api/workbench/dataset/',
  sortConfig: {
    key: 'listOfDataSets',
    field: 'name',
  },
  canImport: () => hasPermission('/workbench/dataset', 'create'),
  canEdit: () => hasPermission('/workbench/dataset', 'update'),
  route: (id: number) => `/specify/workbench/${id}`,
  metaRoute: (id: number) => `/specify/overlay/workbench/${id}/meta/`,
  canCreate: () => hasPermission('/workbench/dataset', 'create'),
  canTransfer: () => hasPermission('/workbench/dataset', 'transfer'),
  canUpdate: () => hasPermission('/workbench/dataset', 'update'),
  canDo: () => hasPermission('/workbench/dataset', 'upload'),
  canUndo: () => hasPermission('/workbench/dataset', 'unupload'),
  canValidate: () => hasPermission('/workbench/dataset', 'validate'),
  localization: {
    datasetsDialog: {
      header: (count: number) =>
        commonText.countLine({
          resource: wbText.dataSets({ variant: wbText.workBench() }),
          count,
        }),
      empty: () =>
        `${wbText.wbsDialogEmpty()} ${hasPermission('/workbench/dataset', 'create')
          ? wbText.createDataSetInstructions()
          : ''
        }`,
    },
    viewer: {
      do: wbText.upload(),
      doStart: wbText.startUpload(),
      doErrors: wbText.uploadErrors(),
      doCancelled: wbText.uploadCanceled(),
      doCancelledDescription: wbText.uploadCanceledDescription(),
      doStartDescription: wbText.startUploadDescription(),
      doErrorsDescription: wbText.uploadErrorsDescription(),
      undo: wbText.rollback(),
      undoConfirm: wbText.beginRollback(),
      undoStartDescription: wbText.beginRollbackDescription(),
      doSuccessfulDescription: wbText.uploadSuccessfulDescription(),
      undoFinishedDescription: wbText.dataSetRollbackDescription(),
      doing: wbText.uploading(),
      doStatus: wbText.wbStatusUpload(),
      doSuccessful: wbText.uploadSuccessful(),
    },
  },
  documentationUrl: "https://discourse.specifysoftware.org/t/the-specify-7-workbench/540"
} as const;

// Defines a shared interface to access dataset variants
export const datasetVariants = {
  workbench: baseWbVariant,
  workbenchChoosePlan: {
    ...baseWbVariant,
    fetchUrl: '/api/workbench/dataset/?with_plan',
    sortConfig: baseWbVariant.sortConfig,
    canImport: () => false,
    canEdit: () => false,
    localization: {
      datasetsDialog: {
        header: () => wbPlanText.copyPlan(),
        empty: () => wbPlanText.noPlansToCopyFrom(),
      },
    },
  },
  batchEdit: {
    ...baseWbVariant,
    fetchUrl: '/api/workbench/dataset/?isupdate=1',
    sortConfig: {
      key: 'listOfBatchEditDataSets',
      field: 'name',
    },
    // Cannot import via the header
    canImport: () => false,
    header: (count: number) =>
      commonText.countLine({
        resource: wbText.dataSets({ variant: batchEditText.batchEdit() }),
        count,
      }),
    canEdit: () => hasPermission('/batch_edit/dataset', 'update'),
    canCreate: () => hasPermission('/batch_edit/dataset', 'create'),
    canTransfer: () => hasPermission('/batch_edit/dataset', 'transfer'),
    canDo: () => hasPermission('/batch_edit/dataset', 'commit'),
    canUndo: () =>
      userPreferences.get('batchEdit', 'editor', 'showRollback') &&
      hasPermission('/batch_edit/dataset', 'rollback'),
    canValidate: () => hasPermission('/batch_edit/dataset', 'validate'),
    localization: {
      datasetsDialog: {
        header: (count: number) =>
          commonText.countLine({
            resource: wbText.dataSets({ variant: batchEditText.batchEdit() }),
            count,
          }),
        empty: () =>
          `${wbText.wbsDialogEmpty()} ${hasPermission('/batch_edit/dataset', 'create')
            ? batchEditText.createUpdateDataSetInstructions()
            : ''
          }`,
      },
      viewer: {
        do: batchEditText.commit(),
        doStart: batchEditText.startCommit(),
        doErrors: batchEditText.commitErrors(),
        doCancelled: batchEditText.commitCancelled(),
        doErrorsDescription: batchEditText.commitErrorsDescription(),
        doStartDescription: batchEditText.startCommitDescription(),
        doCancelledDescription: batchEditText.commitCancelledDescription(),
        undo: wbText.rollback(),
        undoConfirm: wbText.beginRollback(),
        undoStartDescription: batchEditText.startRevertDescription(),
        doSuccessfulDescription: batchEditText.commitSuccessfulDescription(),
        undoFinishedDescription: batchEditText.dateSetRevertDescription(),
        doing: batchEditText.committing(),
        doStatus: batchEditText.beStatusCommit(),
        doSuccessful: batchEditText.commitSuccessful(),
      },
    },
    // TODO: Change this
    documentationUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  },
  bulkAttachment: {
    fetchUrl: '/attachment_gw/dataset/',
    sortConfig: {
      key: 'attachmentDatasets',
      field: 'name',
    },
    canImport: () => hasPermission('/attachment_import/dataset', 'create'),
    header: f.never,
    onEmpty: f.never,
    canEdit: () => hasPermission('/attachment_import/dataset', 'update'),
    route: (id: number) => `/specify/attachments/import/${id}`,
    // Actually, in retrorespect, this would be a nice feature
    metaRoute: f.never,
    documentationUrl: "https://discourse.specifysoftware.org/t/batch-attachment-uploader/1374"
  },
} as const;

export const resolveVariantFromDataset = (dataset: Dataset) =>
  datasetVariants[dataset.isupdate ? 'batchEdit' : 'workbench'];
