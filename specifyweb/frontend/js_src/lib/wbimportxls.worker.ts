
import * as XLSX from 'xlsx';

const ctx: Worker = self as any;

ctx.onmessage = function(e) {

    const previewSize: number | null = e.data.previewSize;

    const reader = new ctx.FileReaderSync();
    const fileData = new Uint8Array(reader.readAsArrayBuffer(e.data.file));

    const options: XLSX.ParsingOptions = previewSize != null ? {type: "array", sheetRows: previewSize} : {type: "array"};
    const workbook = XLSX.read(fileData, options);

    const first_sheet_name = workbook.SheetNames[0];
    const first_workbook = workbook.Sheets[first_sheet_name];
    const sheet_data = XLSX.utils.sheet_to_json(first_workbook, {header: 1, blankrows: false});

    const max_width = Math.max(...sheet_data.map(row => (row as string[]).length));

    const data: string[][] = sheet_data.map(row => {
        const unSparseRow = Array.from(row as string[], v => v || "");
        if (unSparseRow.length < max_width) {
            unSparseRow.push(... new Array(max_width - unSparseRow.length).fill(""));
        }
        return unSparseRow;
    });

    ctx.postMessage(data);
}
