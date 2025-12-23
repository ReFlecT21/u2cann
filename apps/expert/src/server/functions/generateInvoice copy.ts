import ExcelJS from "exceljs";

// Type for generating invoice data
type GenerateInvoiceData = (
  | {
      type: "default";
      payeeInfo: {
        name: string;
        address: string;
        bankName: string;
        accountNumber: string;
        phoneNumber: string;
      };
      lineItems: {
        no: string;
        description: string;
        total: number;
      };
      paymentTerms: string;
    }
  | {
      type: "jp";
      payeeInfo: {
        name: string;
        address: string;
        accountType: string;
        accountNumber: string;
        accountName: string;
      };
      lineItems: {
        dateOfProject: string;
        contents: string;
        unitPrice: number;
        volume: number;
        amount: number;
      };
      remarks: string;
    }
) & {
  date: string;
  invoiceNumber: string;
};

export async function GenerateInvoice({
  buffer,
  invoiceData,
}: {
  buffer: ArrayBuffer;
  invoiceData: GenerateInvoiceData;
}): Promise<ArrayBuffer | boolean> {
  const workbook = new ExcelJS.Workbook();
  const arrayBuffer = new Uint8Array(buffer).buffer;
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.getWorksheet("Invoice");

  // default Invoice Mapping to workbook key is object name and value is excel cell value
  const defaultInvoiceMapping = {
    payeeInfo: {
      name: "B34",
      address: "B2",
      bankName: "B35",
      accountNumber: "B36",
      phoneNumber: "B7",
    },
    lineItems: {
      no: "A17",
      description: "B17",
      total: "G17",
    },
    paymentTerms: "G4",
    invoiceNumber: "G3",
    date: "G2",
  };

  // jp Invoice Mapping to workbook key is object name and value is excel cell value
  //   const jpInvoiceMapping = {
  //     payeeInfo: {
  //       name: "B2",
  //       address: "B3",
  //       bankName: "B4",
  //       accountNumber: "B5",
  //       accountName: "B6",
  //     },
  //     lineItems: {
  //       dateOfProject: "B7",
  //       contents: "B8",
  //       unitPrice: "B9",
  //       volume: "B10",
  //       amount: "B11",
  //     },
  //     remarks: "B12",
  //   };

  if (worksheet) {
    if (invoiceData.type === "default") {
      // Modify the payeeInfo values
      const payeeInfo = defaultInvoiceMapping.payeeInfo;
      Object.entries(payeeInfo).forEach(([key, value]) => {
        console.log("Cell Value", value);
        const cell = worksheet.getCell(value);
        cell.value =
          invoiceData.payeeInfo[key as keyof typeof invoiceData.payeeInfo];
      });

      // Modify the lineItems values
      const lineItems = defaultInvoiceMapping.lineItems;
      Object.entries(lineItems).forEach(([key, value]) => {
        const cell = worksheet.getCell(value);
        cell.value =
          invoiceData.lineItems[key as keyof typeof invoiceData.lineItems];
      });

      //Modify Remaining Values
      const nameCell = worksheet.getCell("B1");
      nameCell.value = invoiceData.payeeInfo.name;

      const totalCell = worksheet.getCell("G33");
      totalCell.value = invoiceData.lineItems.total;

      const paymentTermsCell = worksheet.getCell(
        defaultInvoiceMapping.paymentTerms
      );
      paymentTermsCell.value = invoiceData.paymentTerms;

      const invoiceNumberCell = worksheet.getCell(
        defaultInvoiceMapping.invoiceNumber
      );
      invoiceNumberCell.value = invoiceData.invoiceNumber;

      const dateCell = worksheet.getCell(defaultInvoiceMapping.date);
      dateCell.value = invoiceData.date;
    }
  }
  // Write the modified workbook to a buffer
  const newBuffer = await workbook.xlsx.writeBuffer();
  return newBuffer;
}
