/**
 * Web-Worker for parsing XLS/XLSX files
 *
 * @module
 */

import * as XLSX from 'xlsx';
import { RA } from '../../utils/types';

const context: Worker = self as any;

context.onmessage = function (e) {
  const previewSize: number | null = e.data.previewSize;

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

    const options: XLSX.ParsingOptions = {
      type: 'array',
      raw: true,
      sheetRows: previewSize != null ? previewSize : 0,
    };
    const workbook = XLSX.read(fileData, options);

    const firstSheetName = workbook.SheetNames[0];
    const firstWorkBook = workbook.Sheets[firstSheetName];
    const sheetData = XLSX.utils.sheet_to_json(firstWorkBook, {
      header: 1,
      blankrows: false,
      raw: false,
    });

    const maxMidth = Math.max(
      ...sheetData.map((row) => (row as RA<string>).length)
    );

    const data: RA<RA<string>> = sheetData.map((row) => {
      const unSparseRow = Array.from(row as RA<string>, (v) => v || '');
      if (unSparseRow.length < maxMidth) {
        unSparseRow.push(
          ...Array.from({ length: maxMidth - unSparseRow.length }).fill('')
        );
      }
      return unSparseRow;
    });

    context.postMessage(data);
  });
};
