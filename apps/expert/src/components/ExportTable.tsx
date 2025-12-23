import type { Table } from "@tanstack/react-table";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";

// import { jsPDF } from "jspdf";

import "jspdf-autotable";

export default async function exportToExcel<T extends object>(
  table: Table<T>,
  fileName: string,
) {
  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Table");

  const lastHeaderGroup = table.getHeaderGroups().at(-1);
  if (!lastHeaderGroup) {
    return;
  }

  worksheet.columns = lastHeaderGroup.headers
    .filter((header) => header.column.getIsVisible())
    .map((header) => ({
      header: header.id,
      key: header.id,
      width: 20,
    }));

  table.getCoreRowModel().rows.forEach((row) => {
    const cells = row.getVisibleCells();
    const values = cells.map((cell) => cell.getValue() ?? "");
    worksheet.addRow(values);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  (saveAs as (blob: Blob, name: string) => void)(blob, `${fileName}.xlsx`);
}

// export const exportToPdf = (tableInstance) => {
//   try {
//     const doc = new jsPDF({ orientation: "landscape", format: "a4" });

//     const headerGroup = tableInstance.getHeaderGroups().at(-1);

//     if (!headerGroup) {
//       return;
//     }

//     const headers = headerGroup.headers.map((header) => header.column.id);

//     const rows = tableInstance.getRowModel().rows.map((row) =>
//       row.getVisibleCells().map((cell) =>
//         typeof cell.getValue() === "string"
//           ? doc.splitTextToSize(cell.getValue(), 180) // Auto-split large text
//           : cell.getValue(),
//       ),
//     );

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 10,
//       rowPageBreak: "auto",
//       styles: { overflow: "linebreak", cellPadding: 2 },
//       margin: { top: 20, bottom: 20 },
//     });

//     doc.save("table-export.pdf");
//   } catch (error) {
//     console.error("Failed to export table to PDF:", error);
//   }
// };
