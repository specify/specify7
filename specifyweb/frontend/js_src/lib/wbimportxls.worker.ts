/**
 * Web-Worker for parsed XLSX files
 *
 * @module
 */

import * as XLSX from 'xlsx';

const ctx: Worker = self as any;

ctx.onmessage = function (e) {
  const previewSize: number | null = e.data.previewSize;

  const reader = new FileReader();
  reader.readAsArrayBuffer(e.data.file);
  reader.onload = function (loaded) {
    if (
      loaded.target == null ||
      !(loaded.target.result instanceof ArrayBuffer)
    ) {
      ctx.postMessage([]);
      return;
    }
    const fileData = new Uint8Array(loaded.target.result);

    const options: XLSX.ParsingOptions = {
      type: 'array',
      raw: true,
      sheetRows: previewSize != null ? previewSize : 0,
    };
    const workbook = XLSX.read(fileData, options);

    const first_sheet_name = workbook.SheetNames[0];
    const first_workbook = workbook.Sheets[first_sheet_name];
    const sheet_data = XLSX.utils.sheet_to_json(first_workbook, {
      header: 1,
      blankrows: false,
      raw: false,
    });

    const max_width = Math.max(
      ...sheet_data.map((row) => (row as string[]).length)
    );

    const data: string[][] = sheet_data.map((row) => {
      const unSparseRow = Array.from(row as string[], (v) => v || '');
      if (unSparseRow.length < max_width) {
        unSparseRow.push(...new Array(max_width - unSparseRow.length).fill(''));
      }
      return unSparseRow;
    });

    ctx.postMessage(data);
  };
};
