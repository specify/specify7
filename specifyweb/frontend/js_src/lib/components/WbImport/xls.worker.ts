/**
 * Web-Worker for parsing XLS/XLSX files
 *
 * @module
 */

import dayjs from 'dayjs';
import { read, utils } from 'xlsx';

import type { RA } from '../../utils/types';

const context: Worker = self as any;

context.onmessage = function (e) {
  const previewSize: number | null = e.data.previewSize;
  const dateFormat: number | undefined = e.data.dateFormat;

  const reader = new FileReader();
  reader.readAsArrayBuffer(e.data.file);
  reader.addEventListener('load', (loaded) => {
    if (
      loaded.target == null ||
      !(loaded.target.result instanceof ArrayBuffer)
    ) {
      context.postMessage([]);
      return;
    }
    const fileData = new Uint8Array(loaded.target.result);

    const workbook = read(fileData, {
      type: 'array',
      raw: true,
      cellDates: true,
      sheetRows: previewSize == null ? 0 : previewSize,
    });

    const firstSheetName = workbook.SheetNames[0];
    const firstWorkBook = workbook.Sheets[firstSheetName];
    const sheetData = utils.sheet_to_json(firstWorkBook, {
      header: 1,
      blankrows: false,
      raw: true,
    });

    const maxWidth = Math.max(
      ...sheetData.map((row) => (row as RA<string>).length)
    );

    const data: RA<RA<string>> = sheetData.map((row) => {
      const unSparseRow = Array.from(row as RA<Date | string>, (value) => {
        if (typeof value === 'object') {
          return typeof dateFormat === 'string'
            ? dayjs(value).format(dateFormat)
            : value.toLocaleDateString();
        } else return value || '';
      });
      if (unSparseRow.length < maxWidth) {
        unSparseRow.push(
          ...Array.from({ length: maxWidth - unSparseRow.length }).fill('')
        );
      }
      return unSparseRow;
    });

    context.postMessage(data);
  });
};
