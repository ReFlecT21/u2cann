import type { Table } from "@tanstack/react-table";
import { Workbook } from "exceljs";
import { saveAs } from "file-saver";

import { translateText } from "./translateText"; // uses Google Translate API

export default async function exportToExcel<T extends object>(
  table: Table<T>,
  fileName: string,
) {
  const workbook = new Workbook();

  // Sheet 1: English
  const worksheet = workbook.addWorksheet("Table");
  const lastHeaderGroup = table.getHeaderGroups().at(-1);
  if (!lastHeaderGroup) return;

  // Define exportable headers
  const exportableHeaders = lastHeaderGroup.headers.filter(
    (header) => header.column.columnDef.meta?.isExportOnly === true,
  );

  // Dynamically flatten headers if any row has an "answer" field with questions
  let dynamicAnswerColumns: { key: string; header: string }[] = [];

  for (const row of table.getRowModel().rows) {
    const answerCell = row.getAllCells().find((c) => c.column.id === "answer");
    const answerVal = answerCell?.getValue() ?? null;

    if (
      answerVal &&
      typeof answerVal === "object" &&
      Array.isArray(answerVal.questions)
    ) {
      dynamicAnswerColumns = answerVal.questions
        .map((q: string, idx: number) => ({
          key: `answer_q${idx + 1}`,
          header: `Q${idx + 1}: ${q}`,
        }))
        .flatMap((q, idx) => [
          { key: q.key, header: q.header },
          { key: `confidence_q${idx + 1}`, header: "Confidence Level" },
        ]);
      break;
    }
  }

  worksheet.columns = [
    ...exportableHeaders
      .filter((h) => h.id !== "answer")
      .map((header) => ({
        header:
          typeof header.column.columnDef.header === "string"
            ? header.column.columnDef.header
            : header.column.id,
        key: header.id,
        width: 20,
      })),
    ...dynamicAnswerColumns.map((col) => ({
      header: col.header,
      key: col.key,
      width: 25,
    })),
  ];

  table.getRowModel().rows.forEach((row) => {
    const values: Record<string, any> = {};
    exportableHeaders.forEach((header) => {
      const cell = row.getAllCells().find((c) => c.column.id === header.id);
      let val = cell?.getValue() ?? "";

      if (header.id === "work_history" && Array.isArray(val)) {
        val = val
          .map(
            (job: any) =>
              `${job.position} at ${job.companyName} (${job.start} - ${job.end})`,
          )
          .join(" | ");
      } else if (header.id === "answer") {
        // Already handled dynamically, skip default export
        return;
      }

      values[header.id] = val;
    });

    const answerCell = row.getAllCells().find((c) => c.column.id === "answer");
    const answerVal = answerCell?.getValue() ?? null;

    if (
      answerVal &&
      typeof answerVal === "object" &&
      Array.isArray(answerVal.questions)
    ) {
      answerVal.questions.forEach((q: string, idx: number) => {
        values[`answer_q${idx + 1}`] = answerVal.responses?.[idx] ?? "";
        values[`confidence_q${idx + 1}`] =
          answerVal.confidence_levels?.[idx] ?? "";
      });
    }
    worksheet.addRow(values);
  });

  // Sheet 2: Japanese
  const jpSheet = workbook.addWorksheet("日本語");

  // ✅ Translate headers dynamically
  jpSheet.columns = await Promise.all(
    exportableHeaders.map(async (header) => {
      const accessor = header.column.id;
      const label =
        typeof header.column.columnDef.header === "string"
          ? header.column.columnDef.header
          : accessor;

      const shouldKeepEnglish = ["expert_fullName", "expert_linkedin"].includes(
        accessor,
      );
      const translatedHeader = shouldKeepEnglish
        ? label
        : await translateText(label, "ja");

      return {
        header: translatedHeader,
        key: accessor,
        width: 20,
      };
    }),
  );

  // ✅ Translate row content dynamically (skip name/linkedin)
  for (const row of table.getRowModel().rows) {
    const values: Record<string, any> = {};

    for (const header of exportableHeaders) {
      const accessor = header.column.id;
      const cell = row.getAllCells().find((c) => c.column.id === accessor);
      const val = cell?.getValue() ?? "";

      let displayValue = val;
      if (accessor === "work_history" && Array.isArray(val)) {
        displayValue = val
          .map(
            (job: any) =>
              `${job.position} @ ${job.companyName} (${job.start} → ${job.end})`,
          )
          .join("\n");
      } else if (
        accessor === "answer" &&
        typeof val === "object" &&
        val.questions
      ) {
        displayValue = val.questions
          .map((q: string, idx: number) => {
            const response = val.responses?.[idx] ?? "";
            return `Q${idx + 1}: ${q}\nA: ${response}`;
          })
          .join("\n");
      } else if (accessor === "projectStatus") {
        displayValue = val === true ? "進行中" : "未着手";
      }

      const shouldPreserveEnglish =
        accessor === "expert_fullName" || accessor === "expert_linkedin";

      values[accessor] =
        shouldPreserveEnglish ||
        typeof displayValue !== "string" ||
        displayValue.trim() === ""
          ? displayValue
          : await translateText(displayValue, "ja");
    }

    jpSheet.addRow(values);
  }

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
